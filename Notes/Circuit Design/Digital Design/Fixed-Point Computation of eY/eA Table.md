---
title: eA Table
description: "The 2^k-entry ROM holding e^A, with the half-ulp rounding bit pre-added to every entry so the final round-by-truncation is free, and a truncated output T_trunc sized to balance the multiplier."
kind: circuit
source: "ASA §22.5.1 and §22.5.4, pp. 655-661"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, table, rom, exponential]
aliases:
  - e^A Table
  - eA ROM
  - Exponential Table
---

# eA Table

The $2^k$-entry read-only table addressed by the $k$ most significant bits of the reduced argument, whose distinguishing trick is that the half-ulp of the *final* result is baked into every stored entry, so the operator's last rounding step costs nothing but a wire cut.

```tikz title="e^A table: address from the A field of Y, full tap T and truncated tap T_trunc"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % Y bit field
  \draw (-4.4,7.5) rectangle (-1.6,8.1);
  \draw (-1.6,7.5) rectangle (3.2,8.1);
  \node at (-3.0,7.8) {$A$};
  \node at (0.8,7.8) {$Z$};
  \node[anchor=east] at (-4.5,7.8) {$Y=$};
  \node[anchor=south] at (-4.4,8.15) {\scriptsize$-1$};
  \node[anchor=south] at (-1.6,8.15) {\scriptsize$-k$};
  \node[anchor=south] at (3.2,8.15) {\scriptsize$\ell$};
  \node[anchor=west] at (3.3,7.8) {\scriptsize$\ell=-w_F-g$};

  % address bus
  \draw[->] (-3.0,7.5) -- (-3.0,6.6);
  \node[anchor=east] at (-3.1,7.0) {\scriptsize$k$ bits, \texttt{sfix}$(-1,-k)$};
  \node[anchor=west] at (-2.9,7.0) {\scriptsize address};

  % ROM
  \draw[thick] (-5.6,4.9) rectangle (-0.4,6.6);
  \node at (-3.0,6.2) {$e^A$ table};
  \node at (-3.0,5.75) {\scriptsize$2^k$ entries of $1-\ell+g'$ bits};
  \node at (-3.0,5.30) {\scriptsize each with $2^{\ell-1}$ pre-added};

  % T bus
  \draw[->] (-3.0,4.9) -- (-3.0,1.2);
  \node[anchor=east] at (-3.1,3.6) {$T\approx e^A+2^{\ell-1}$};
  \node[anchor=east] at (-3.1,3.15) {\scriptsize\texttt{ufix}$(0,\ell-g')$};

  % T_trunc tap
  \draw (-3.0,3.9) -- (0.6,3.9);
  \draw[->] (0.6,3.9) -- (0.6,2.9);
  \node[anchor=west] at (0.7,3.55) {$T_{\mathrm{trunc}}$ = top $1-\ell-t+g'$ bits};
  \node[anchor=west] at (0.7,3.15) {\scriptsize\texttt{ufix}$(0,\ell+t-g')$, drop $t$ LSBs};

  % multiplier
  \draw (-0.4,2.0) rectangle (2.6,2.9);
  \node at (1.1,2.45) {$\times\ F$};
  \draw[->] (3.6,2.45) -- (2.7,2.45);
  \node[anchor=west] at (3.7,2.45) {\scriptsize$F\approx e^Z-1$, \texttt{ufix}$(-k,\ell-g')$};
  \draw[->] (1.1,2.0) -- (1.1,1.2);
  \node[anchor=west] at (1.2,1.6) {\scriptsize\texttt{ufix}$(-k+1,\ell-g')$};

  % final adder
  \draw (-4.0,0.4) rectangle (2.2,1.2);
  \node at (-0.9,0.8) {$+$};
  \draw[->] (-0.9,0.4) -- (-0.9,-0.4);
  \node[anchor=west] at (-0.8,0.0) {$M_{\mathrm{full}}$\ \ \scriptsize\texttt{ufix}$(0,\ell-g')$};

  % truncation
  \draw[dashed] (-3.6,-0.4) rectangle (1.8,-1.1);
  \node at (-0.9,-0.75) {\scriptsize round by truncation: drop $g'$ LSBs};
  \draw[->] (-0.9,-1.1) -- (-0.9,-1.8);
  \node[anchor=west] at (-0.8,-1.5) {$M$\ \ \scriptsize\texttt{ufix}$(0,\ell)$};
\end{circuitikz}
\end{document}
```

*After Fig. 22.6, p. 657, redrawn around the table alone. $\ell=-w_F-g$; $g'$ = guard bits internal to the $e^Y$ operator; $t$ = truncation of the tap feeding the multiplier; $u=2^{\ell-g'}$ is the datapath ulp.*

**The table exists because a second, multiplication-free range reduction splits $Y$ by bit position.** Write $Y = A + Z$ (22.19), $A$ being the $k$ MSBs of $Y$ at positions $-1$ down to $-k$ and $Z$ the remainder at positions $-k-1$ down to $\ell$. By the exponential's addition law $e^{x+y}=e^xe^y$,

$$e^Y = e^{A+Z} = e^A\cdot e^Z \qquad (22.20)$$

$A$ takes only $2^k$ distinct values, so $e^A$ is a lookup and nothing else. Everything transcendental that remains lives on the $Z$ side, where $0\le Z<2^{-k}$ makes Taylor cheap — see [[hZ Table]] and [[Higher-Order eY Architecture]] for that half. This note is only about the ROM.

**The address is the raw two's-complement bit pattern of $A$, sign bit included.** $A$ is `sfix`$(-1,-k)$ — $k$ bits, signed, since $Y$ itself is signed. Feeding those $k$ bits straight into the address decoder puts $A<0$ in the *upper* half of the ROM and $A\ge0$ in the lower half. That is not a defect to correct: the address decoder has no arithmetic meaning, so any bijection between $A$'s $2^k$ values and the $2^k$ table rows is as good as any other, and the identity map on the bit pattern is the one that costs zero gates. Only the table *contents* have to know the interpretation. Compare [[Table-Based Function Evaluation]], where the same freedom is exploited to fold symmetric functions.

**Each entry is sized by the internal datapath's ulp, not the operator's.** The table output $T\approx e^A$ is `ufix`$(0,\ell-g')$: MSB at position $0$ because $e^A\in[e^{-1/2},e^{1/2})\subset[0.6,1.65)$ never reaches $2$, and LSB at $\ell-g'$ because $g'$ guard bits are carried internally. That is $1-\ell+g'$ bits per entry and

$$2^k\times(1-\ell+g')\ \text{bits total}$$

Cost is exponential in $k$ and linear in precision, which is the whole reason $k$ is the architecture's principal knob — see [[Choosing an eY Architecture]].

> [!important]
> **Pre-add $2^{\ell-1}$ to every entry and the final rounding becomes free.** The operator's last step drops the $g'$ guard bits from $M_{\mathrm{full}}$ down to $M$ = `ufix`$(0,\ell)$. Done as a plain truncation that is a round-toward-zero with error up to $2^{\ell}$; done properly it is a round-to-nearest with error $2^{\ell-1}$, and normally costs an increment of a $1-\ell+g'$-bit word. But truncation of $x+2^{\ell-1}$ *is* round-to-nearest of $x$ — the standard round-to-nearest-by-truncation identity from [[Rounding]] — and $T$ enters $M_{\mathrm{full}} = T + T_{\mathrm{trunc}}\cdot F$ as a plain additive term. So bias the constant into the ROM at compile time: the entry stored is $\circ(e^A)+2^{\ell-1}$, the adder is unchanged, and the rounding hardware disappears entirely.

**The pre-added bit does not leak into the multiplier**, provided $g'\le t$. $T_{\mathrm{trunc}}$ keeps bits down to position $\ell+t-g'$, and the rounding bit sits at $\ell-1$; the bit is dropped by that truncation exactly when $\ell-1<\ell+t-g'$, i.e. $g'\le t$. Since $t$ is chosen near $k$ and $g'\le3$ in practice, the condition holds with room to spare, and the product path never sees the bias. If it did, the bias would be amplified by $F$ and the error accounting below would need a term for it.

**Round the entries to nearest, because the resulting error is amplified before it reaches the output.** With round-to-nearest tabulation the stored value satisfies $|T-e^A|\le u/2$, and this error reaches $M$ multiplied by $e^Z$:

$$\delta_T = (T-e^A)e^Z,\qquad \bar\delta_T = \frac{u}{2}\times1.25 = 0.625u$$

where $1.25$ is a rough bound on $e^Z$ for $0\le Z<2^{-k}$. Truncating the entries instead would double this to $1.25u$ and eat a quarter of the whole $\bar\delta_{\mathrm{arch}}<5u$ budget for nothing — the table is precomputed in software, so correct rounding of its contents is free. See [[Error Accuracy]] for the ulp conventions.

**The second, truncated tap exists to square up the multiplier.** A truncated multiplier is only efficient when its two operands are about the same width ([[Truncated Multipliers]]), and $F\approx e^Z-1$ is $k$ bits shorter than $T$ because $f(Z)<2^{-k+1}$ leaves $k-1$ leading zeros. Rather than pad $F$, shorten $T$: $T_{\mathrm{trunc}}$ keeps the top $1-\ell-t+g'$ bits, format `ufix`$(0,\ell+t-g')$. The cost is

$$\delta_{\mathrm{trunc}T} = (T_{\mathrm{trunc}}-T)(Z+H),\qquad \bar\delta_{\mathrm{trunc}T} \le 2^{\ell+t-g'}\times1.25\cdot2^{-k} = 1.25\cdot 2^{t-k}\,u$$

Balancing that against the datapath ulp $u$ gives $t=k$ for $1.25u$, or $t=k-1$ for $0.625u$ when the $h$ evaluator is only faithful and the budget is tighter. Note the table is read at full width and truncated *after* the read — the ROM has one output port, and the tap is a wire selection, not a second memory.

**On FPGA the table lands in block memory, where two of these parameters relax for free** ([[Block Memory]], [[FPGAs]]). The entry width can be widened at no cost up to the memory's native output width, so $g'$ may be increased for nothing; and $t$ may be reduced — improving $\delta_{\mathrm{trunc}T}$ — as long as $T_{\mathrm{trunc}}$ still fits one DSP input, which on an asymmetric $25\times18$ block leaves real slack. On ASIC neither is free: both are paid in ROM area and multiplier width, so the balanced $t=k$ is the honest choice there. The single-precision case study ($w_F=23$, $g=4$, $g'=0$, $\ell=-27$, $k=10$, $t=10$) puts the table at $2^{10}\times28$ bits, which shares one 36 Kbit block RAM in $2^{10}\times36$ dual-port mode with the $2^8\times6$-bit $h$ table — see [[eY DSP and BRAM Mapping]].

$$\boxed{\ \mathrm{ROM}[A] \;=\; \circ\!\left(e^{A}\right)+2^{\ell-1},\qquad 2^{k}\times(1-\ell+g')\ \text{bits},\qquad \bar\delta_T = 0.625u\ }$$

**When it breaks.**

- $g'=0$ kills the trick. With no guard bits there is no final rounding step to absorb, $\bar\delta_{\text{final round}}=0$ by definition, and the pre-added constant would be an outright error. The bias is conditional on $g'>0$, not unconditional.
- $g'>t$ pushes the rounding bit above $T_{\mathrm{trunc}}$'s LSB and it enters the product amplified by $F$. Not reachable with the parameters the book recommends, but it is the assumption a re-parameterisation can silently violate.
- $2^k$ is the cliff. The [[First-Order eY Architecture]] needs $k\approx(\ell+1)/2$, so at IEEE single precision it wants $k=14$ — a $2^{14}$-entry table, at which point paying for an $h$ evaluator to buy $k$ back down to $10$ is the cheaper trade.
- Below roughly $2^9$ entries a block RAM is mostly empty and LUT-based distributed ROM wins; the $2^k$ scaling argument only applies once the memory is being filled.
- The $1.25$ amplification is $e^Z$, not $T$. The $1.65$ bound that appears elsewhere in the error budget bounds $T$ and applies to error injected on the $h$ side; using the wrong one of the two double-counts or under-counts.

**RTL (Spade).** A concrete instance: $k=3$, $\ell=-13$, $g'=3$, so $u=2^{-16}$, entries are $1-\ell+g'=17$ bits, and the pre-added $2^{\ell-1}=2^{-14}$ is $4$ ulp. With $t=k=3$, $T_{\mathrm{trunc}}$ is the top 14 bits.

```spade
entity ea_table(a: uint<3>) -> (uint<17>, uint<14>) {
    let rom: [uint<17>; 8] = [
        65540, 74266, 84154, 95358,   // A = +0.000 +0.125 +0.250 +0.375
        39754, 45046, 51043, 57839,   // A = -0.500 -0.375 -0.250 -0.125
    ];
    let t = rom[a];
    (t, t.as_bits()[3..17].as_uint())
}
```

`a` is the address bus of the diagram — the raw `sfix`$(-1,-3)$ bit pattern of $A$, which is why the second row of the array holds the negative half of $A$ in ascending two's-complement order rather than in ascending numerical order. The first returned value is $T$, the second is the $T_{\mathrm{trunc}}$ tap: `as_bits()[3..17]` drops the low $t=3$ bits, index 0 being the LSB, and it is a wire selection with no logic behind it. Every entry already carries $+4$; e.g. $A=0$ stores $65540$, not $65536$. The block is purely combinational, and synthesis will not build the array as a mux tree as written — it infers a ROM, mapped to LUTs at this size and to a block RAM once $k$ reaches 9 or so, at which point the tool inserts an output register whether the drawing shows one or not.

**Related Notes.**

- [[Higher-Order eY Architecture]] – depends-on: consumes both taps of this table, $T$ into the final adder and $T_{\mathrm{trunc}}$ into the multiplier.
- [[hZ Table]] – compares: the other ROM in the same architecture, sized by $h(Z)<2^{-2k}$ rather than by $2^k$ addresses.
- [[First-Order eY Architecture]] – extends: same table, no $h$ box, and $k\approx(\ell+1)/2$ instead of a free parameter.
- [[Truncated Multipliers]] – supports: the reason $T_{\mathrm{trunc}}$ exists at all is that a truncated multiplier wants square operands.
- [[Rounding]] – supports: the round-to-nearest-by-truncation identity that makes the pre-added bit legal.
- [[Block Memory]] – supports: the FPGA resource this maps to, and the source of the free width.
- [[Table-Based Function Evaluation]] – compares: the general technique this is one instance of.
- [[eY DSP and BRAM Mapping]] – extends: how this table and the $h$ table share a single 36 Kbit BRAM.
- [[Choosing an eY Architecture]] – compares: where the $2^k$ cost of this table stops being payable.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §22.5 "Fixed-Point Computation of $e^Y$":

- §22.5.1 Using large tables and square multipliers — pp. 655–657 (Figs. 22.5, 22.6; eqs. 22.19–22.28)
- Error analysis, $\delta_T$ / $\delta_{\mathrm{trunc}T}$ / $\delta_{\text{final round}}$ terms — pp. 658–659 (eq. 22.29)
- §22.5.4 FPGA-specific remarks and the single-precision case study — p. 661
