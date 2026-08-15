---
title: "LDTC, Lossless Differential Table Compression"
description: "Splits any ROM into a sub-sampling table plus a narrow difference table and one addition, reproducing the original value bit-for-bit at 20-50% of the bits."
kind: circuit
source: "ASA §17.1, pp. 497-502"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, rom, compression, lossless, fpga]
aliases:
  - LDTC
  - Lossless Differential Table Compression
  - Differential Table Compression
  - Table Compression
---

# LDTC, Lossless Differential Table Compression

A ROM replacement that stores one coarse value per group of $2^s$ addresses plus a narrow per-address difference, and is the only member of this chapter that is *exact* — the reconstructed word is bit-for-bit the original table entry, so it composes with every approximation method instead of competing with them.

```tikz title="LDTC datapath: sub-sampling table, difference table, and the v-bit overlap that is the only place a carry can occur"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------- input word A ----------
\draw[thick] (0,6.2) rectangle (3.6,6.65);
\foreach \i in {1,...,7} \draw[gray] (0.45*\i,6.2) -- (0.45*\i,6.65);
\draw[very thick] (2.25,6.2) -- (2.25,6.65);
\node[font=\small,anchor=east] at (-0.15,6.42) {$A$};
\node[font=\tiny,anchor=west] at (3.75,6.42) {$w_A=8$};
\draw[<->,gray] (0,6.95) -- node[above,font=\tiny]{$B$: $w_A-s=5$} (2.25,6.95);
\draw[<->,gray] (2.25,6.95) -- node[above,font=\tiny]{$s=3$} (3.6,6.95);
% ---------- tables ----------
\node[draw,thick,minimum width=2.3cm,minimum height=1.15cm,align=center] (tss) at (1.0,4.9)
  {$T_{ss}$\\[-3pt]{\tiny $2^{w_A-s}=32$ entries}\\[-5pt]{\tiny $w_H=7$ bits each}};
\node[draw,thick,minimum width=2.8cm,minimum height=1.15cm,align=center] (td) at (4.9,4.9)
  {$T_d$\\[-3pt]{\tiny $2^{w_A}=256$ entries}\\[-5pt]{\tiny $w_L=3$ bits each}};
\draw[->] (1.0,6.2) -- node[left,font=\tiny]{$5$} (1.0,5.48);
\draw[->] (1.8,6.2) -- (1.8,5.95) -- (4.9,5.95) -- node[right,font=\tiny]{$8$} (4.9,5.48);
% ---------- the two operands, on one 8-bit grid ----------
% H : w_H = 7 bits, MSB-aligned ; L : w_L = 3 bits, LSB-aligned
\fill[gray,opacity=0.18] (2.85,2.4) rectangle (3.75,3.4);
\draw[thick] (0.6,3.0) rectangle (3.75,3.4);
\foreach \i in {1,...,6} \draw[gray] (0.6+0.45*\i,3.0) -- (0.6+0.45*\i,3.4);
\node[font=\tiny,anchor=east] at (0.45,3.2) {$H$, $w_H=7$};
\draw[thick] (2.85,2.4) rectangle (4.2,2.8);
\foreach \i in {1,2} \draw[gray] (2.85+0.45*\i,2.4) -- (2.85+0.45*\i,2.8);
\node[font=\tiny,anchor=east] at (2.7,2.6) {$L$, $w_L=3$};
\draw[<->] (2.85,3.66) -- (3.75,3.66);
\node[font=\tiny,anchor=south] at (3.3,3.72) {$v=w_H{+}w_L{-}w_R=2$};
\draw[->] (1.0,4.32) -- (1.0,3.4);
\draw[->] (4.9,4.32) -- (4.9,2.6) -- (4.2,2.6);
% ---------- adder ----------
\node[draw,thick,minimum width=4.0cm,minimum height=0.45cm] (add) at (2.4,1.2) {$+$};
\draw[->] (0.9,3.0) -- (0.9,1.43);
\draw[->] (3.5,2.4) -- (3.5,1.43);
% ---------- result ----------
\draw[thick] (0.6,0.2) rectangle (4.2,0.65);
\foreach \i in {1,...,7} \draw[gray] (0.6+0.45*\i,0.2) -- (0.6+0.45*\i,0.65);
\node[font=\tiny,anchor=east] at (0.45,0.42) {$R=T(A)$, $w_R=8$, exact};
\draw[->] (2.4,0.97) -- (2.4,0.65);
\node[font=\tiny,align=center] at (2.4,-0.5)
  {only the $v=2$ shaded columns ever carry; the low $w_R-w_H=1$ bit\\
   of $R$ is a bit of $L$ passed through, so the adder is $w_H$ bits wide};
\end{circuitikz}
\end{document}
```

*after Fig. 17.1, p. 498, instantiated with the parameters of the $\sin(\pi x/4)$ example of p. 502*

**Turn one table into two by sub-sampling the address.** A table $T:A\mapsto R$ has $w_A$ address bits and $w_R$ output bits, so it costs $2^{w_A}w_R$ bits — exponential in $w_A$, which is why every method in [[Table-Based Function Evaluation]] attacks $w_A$. Sub-sample $T$ by a factor $2^s$: the **sub-sampling table** $T_{ss}:B\mapsto H$ is addressed by $B=\lfloor A/2^s\rfloor$ on $w_B=w_A-s$ bits and holds $w_H$ bits per entry; the **difference table** $T_d:A\mapsto L$ keeps all $2^{w_A}$ entries but only $w_L$ bits, because it stores local variation rather than magnitude. A *slice* is the run of $2^s$ consecutive entries of $T$ reconstructed from one $T_{ss}$ entry. Storage falls as soon as

$$2^{w_A-s}\,w_H + 2^{w_A}\,w_L \;<\; 2^{w_A}\,w_R$$

and the whole method rests on the fact that a table whose neighbouring entries differ by little admits $w_L\ll w_R$. Formats and ulp conventions for $A$ and $R$ are those of [[Number Formats]]; no error analysis appears anywhere below, because there is no error.

**The hypothesis is about the stored bits, not about the function.** Tabulating a continuous, differentiable function with bounded derivatives ([[Fixed-Point Function Approximation]]) gives "small local variations" for free, but LDTC does not need that: the polynomial coefficient tables emitted by a numerical minimax optimisation compress well even though no real function samples them, and one of those tables is not even monotonic (p. 498). The honest formal definition in the book is circular — *$T$ compresses if Algorithm 17.1 succeeds* — and that is the correct engineering posture, because the test is exhaustive and cheap. The one family that does **not** compress is [[KCM, Table-Based Constant Multiplication]]: its tables have already spent exactly this redundancy (p. 499).

**Reclaim the systematic zeros, and watch the overflow bit.** In Hsiao's first version $T_{ss}$ stores the true slice minimum at full $w_R$ width, so one entry of $T_d$ per slice is systematically zero — pure waste. Dropping the $w_R-w_L$ least significant bits of each $T_{ss}$ entry recovers them: $T_{ss}$ now holds only the $w_H$ upper bits of the minimum and shrinks accordingly, while the values in $T_d$ grow and may need one extra output bit. That extra bit is the expensive kind — it is paid $2^{w_A}$ times, once per entry of the large table, whereas keeping $k$ more output bits in $T_{ss}$ costs only $k\cdot 2^{w_A-s}$ bits in the small one. Because the two effects pull against each other in units that differ by the factor $2^s$, the triplet $(s,w_H,w_L)$ is **enumerated, not derived** (p. 500).

> [!warning] Two exponents in §17.1.2 appear to be swapped
> The book writes that $T_d$ "systematically has $2^s$ entries equal to 0: one for each slice" (p. 499) and that $k$ extra output bits in $T_{ss}$ cost "$k\cdot 2^s$ bits" (p. 500). There are $2^{w_A-s}$ slices and $2^{w_A-s}$ entries in $T_{ss}$, so both should read $2^{w_A-s}$; Fig. 17.1 and Table 17.1 are consistent with $w_B=w_A-s$. The argument is unaffected — the two costs still differ by the factor $2^s$ that motivates the search — but the numbers as printed are wrong.

**Alignment is a wiring choice, not a shift.** Because $T_{ss}$ stores only the upper $w_H$ bits of the slice minimum, its contribution to the sum is $H\cdot 2^{\,w_R-w_H}$, which in hardware is the stored word wired to the top $w_H$ columns with the bottom $w_R-w_H$ columns tied to zero — no shifter, no cost. $L$ sits LSB-aligned. The two operands therefore overlap in

$$v \;=\; w_H + w_L - w_R$$

columns, and $v$ is the entire arithmetic content of the reconstruction: outside the overlap the sum is a copy. As a standalone adder it is only $w_H$ bits wide, since the low $w_R-w_H$ bits of $R$ are bits of $L$ unchanged. Better, in most real uses the table output is already headed for a [[Compressor Trees|compressor tree]], so the addition is merged into the [[Bit Heaps|bit heap]] and contributes exactly $v$ extra bits to it (Fig. 17.2, p. 502). If those $v$ bits do not force one more compression stage, the delay overhead is **zero**.

**Validity is a per-slice max-min test, and it is cheaper than filling the tables.** For each slice take $M=\max$ and $m=\min$ of its $2^s$ values; set $H=m-\left(m\ \&\ (2^{\,w_R-w_H}-1)\right)$, that is $m$ with its low $w_R-w_H$ bits cleared, the largest representable base not exceeding any value in the slice; reject the whole vector if $M-H\ge 2^{w_L}$. One slice that does not fit kills the parameter vector, so the test exits early. Its cost is proportional to $2^{w_A-s}$ rather than $2^{w_A}$ because the per-slice max and min are computed once per value of $s$ and memoised — exploration is "almost instantaneous for any size for which tabulation is practical" (p. 501). Since the cost function is cheaper still, Algorithm 17.1 filters by cost *first* and checks validity only on candidates that would beat the incumbent.

**Bit count is not area, and on FPGAs the gap decides whether it is worth it.** From the cost model of Sect. 16.4.2 (p. 492), a $2^k\times n$ table costs $2^{\max(k-\lambda,0)}\times n$ LUTs on a $\lambda$-input device ([[FPGAs]]), so any table with at most $2^\lambda$ entries is free real estate — shrinking $T_{ss}$ past that point saves nothing the bit count claims it saves. For the $w_A=w_R=8$ example below, on $\lambda=6$: the plain $T$ is $2^2\times8=32$ LUTs, against $T_{ss}=2^{0}\times7=7$ and $T_d=2^{2}\times3=12$, plus roughly $w_H=7$ LUTs of carry-chain adder — about 26 LUTs, a ratio of $0.81$ where the bit count promised $0.48$ (computed here from the p. 492 model, not measured). The bit-count ratio is recovered only when the tables are large enough that the adder is noise, or when the addition disappears into a bit heap. Above the LUT/[[Block Memory|BRAM]] crossover the calculus inverts again: a plain table that fits one block RAM costs no logic at all, and splitting it into two tables of awkward widths can cost *two* blocks plus fabric.

**What it actually buys.** Integrated into [[FloPoCo]] behind `tableCompression`, ratios of $0.5$–$0.8$ are typical (20–50% savings), with a best reported $0.36$; the optimal overlap is usually $v=2$, occasionally $3$ (p. 502). LDTC works best when $w_R$ and $w_A$ are close: $T_d$ is always the big table, and it is narrow precisely when $w_R\approx w_A$. For $f=\sin(\pi x/4)$ with $\ell_{in}=\ell_{out}=-8$ the search returns $(s,w_H,w_L)=(3,7,3)$, hence $v=2$:

| $w_A=w_R=8$ | bits |
| --- | --- |
| plain table $T$ | $8\times2^8=2048$ |
| $T_{ss}$ | $7\times2^5=224$ |
| $T_d$ | $3\times2^8=768$ |
| **total, ratio 0.48** | **992** |

*(re-derived here by running Algorithms 17.1–17.2 over the whole triplet space; it reproduces p. 502 exactly.)*

$$\boxed{\ T(A)\;=\;T_{ss}\!\left(\lfloor A/2^{s}\rfloor\right)\cdot 2^{\,w_R-w_H}\;+\;T_d(A),\qquad v=w_H+w_L-w_R\ }$$

**When it breaks.** One outlier kills a slice and one bad slice kills the parameter vector — the test is on $\max-\min$, never on an average, so a table with a single discontinuity compresses no better than its worst run of $2^s$ entries. Compression is a **constant factor**, never a change of asymptotics: $2^{w_A}w_L$ is still exponential in $w_A$, so LDTC cannot rescue a table that is too big, it only makes a feasible one cheaper — that is what [[Multipartite Methods]] are for. When $w_R\ll w_A$ the difference table dominates and has little room left to shrink. If the chosen $w_L$ forces the overflow bit, the extra cost lands on all $2^{w_A}$ entries and usually eats the gain. And the search is offline and exhaustive over the *contents*: the table must already exist as data, so LDTC is a back-end pass in a generator, not a formula you can size a design with.

```spade
/// LDTC reconstruction: T(A) = T_ss(A >> s) + T_d(A), exactly.
/// w_A = 5, w_R = 8, s = 2, w_H = 4, w_L = 5, v = 1.
/// T_ss holds only the w_H upper bits of each slice minimum, so it is
/// re-aligned by a concat with (w_R - w_H) zeros, never by a shifter.
entity ldtc_sin5(a: uint<5>) -> uint<8> {
    let tss: [uint<4>; 8] = [0, 1, 3, 4, 6, 7, 8, 10];
    let td: [uint<5>; 32] = [
         0,  6, 13, 19,  9, 15, 22, 28,  2,  8, 14, 20, 10, 16, 22, 28,
         2,  8, 13, 19,  9, 14, 20, 25, 14, 19, 24, 29,  2,  7, 12, 17,
    ];
    let h = tss[a.as_bits()[2..5].as_uint()];
    let l = td[a];
    let pad: uint<4> = 0;
    trunc(h.concat(pad) + zext::<5, 8>(l))
}
```

The tables are a smaller instance than the drawing so that both fit on the page: the same $\sin(\pi x/4)$, sampled at $w_A=5$ into $w_R=8$ bits, for which the search returns $(s,w_H,w_L)=(2,4,5)$ — $8\times4+32\times5=192$ bits against $256$. `a.as_bits()[2..5]` is $B=\lfloor A/2^s\rfloor$, the top $w_A-s=3$ address bits (index 0 is the LSB), and it is pure wiring; `h.concat(pad)` is the $2^{\,w_R-w_H}$ scaling of the diagram, also pure wiring. The `trunc` on the sum is where validity is cashed in: `+` returns $w_R+1=9$ bits, and the discarded carry-out is guaranteed zero *only* because Algorithm 17.2 accepted this vector — a wrong $(s,w_H,w_L)$ compiles identically and silently wraps. Everything here is combinational; synthesis maps `tss` and `td` to LUTs or to a block RAM, and only then does the shape of the chosen memory primitive, rather than the bit count, decide whether the split paid.

Verified with `spade 0.19.0` and simulated against an independent behavioural reference holding the uncompressed $T$: all 32 addresses exhaustively — which is a *complete* proof for a lossless method, since the claim is bit-for-bit equality on every input — plus 3000 random and 4 named asymmetric vectors, of which $A=1\mapsto 6$ against $A=16\mapsto 98$ is the pair that fails if the address bit order is reversed.

**Related notes.**

- [[Fixed-Point Function Approximation]] – depends-on: supplies the plain table $T$ that LDTC compresses, and the format conventions for $A$ and $R$.
- [[Multipartite Methods]] – compares: attacks the same exponential by approximation rather than exactly, and buys a factor of tens instead of two.
- [[Multipartite with Compressed TIV]] – extends: LDTC's original application, compressing the table of initial values inside a multipartite architecture.
- [[Bit Heaps]] – supports: absorbs the reconstruction addition as $v$ extra bits, which is what makes the delay overhead zero.
- [[Compressor Trees]] – supports: the structure those $v$ bits merge into; free unless they force one more compression stage.
- [[KCM, Table-Based Constant Multiplication]] – counter-example: a table family that will not compress, because the technique has already exploited the same redundancy.
- [[Block Memory]] – counter-example: above the BRAM crossover, two odd-shaped tables can cost more resources than the uncompressed ROM.
- [[Choosing a Table Method]] – compares: where this sits against every sibling in the chapter.
- [[FloPoCo]] – supports: the generator that runs the search, behind `tableCompression`.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Sect. 17.1 "Lossless Differential Table Compression", pp. 497–502.

- 17.1 introduction and Fig. 17.1 (uncompressed vs compressed table), pp. 497–498; Table 17.1 notations, p. 499
- 17.1.1 applicability, non-monotonic coefficient tables, KCM exclusion, pp. 498–499
- 17.1.2 parameter space, systematic zeros and the overflow bit, pp. 499–500
- 17.1.3 Algorithms 17.1 (enumeration) and 17.2 (validity), pp. 500–501
- 17.1.4 cost function, the $w_H$-bit adder, bit-heap merge and Fig. 17.2, pp. 501–502
- 17.1.5 evaluation, FloPoCo `tableCompression`, the $\sin(\pi x/4)$ figures, p. 502
- Sect. 16.4.2 "Actual Cost of a ROM", p. 492 — the LUT and BRAM cost model used above

Cited works: [Hsi+15], [Hsi+17] (LDTC in the multipartite context), [CFD22] (generalisation, best ratio 0.36).
