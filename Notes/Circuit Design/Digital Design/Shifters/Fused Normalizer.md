---
title: Fused Normalizer
description: "Merges the naive LZC into the shifter: each level NORs its top 2^j bits, emits c_j and immediately shifts under it, so the MSB-first count bits are consumed as they are produced. O(w_X log w_X) area, and near log w_X delay on FPGA — but no place to do arithmetic on the count, so not for IEEE-754."
kind: circuit
source: "ASA §10.3, pp. 323-325"
status: seed
spade: simulated
tags: [digital, shifters, normalizer, lzc, floating-point]
aliases:
  - Fused Normalizer
  - Fused LZC-Shifter
  - Combined LZC and Shifter
  - Combined Leading Zero Counter and Shifter
---

# Fused Normalizer

A normalizer in which the leading-zero count is never computed as a separate value: each level derives its own count bit from the word in front of it and spends that bit on its own shift in the same step, so the counter and the shifter are one structure rather than two in series.

```tikz title="14-bit fused normalizer: four levels, each a NOR over its top 2^j bits driving its own shift"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  mux/.style={draw,fill=black!5,rounded corners=1pt,minimum width=44mm,minimum height=7mm,inner sep=2pt},
  nor/.style={draw,rounded corners=1.2pt,minimum width=11mm,minimum height=5.5mm,inner sep=1pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
% ---------- level 3 : shift by 8 ----------
\node at (0,7.2) {$X$};
\draw[-] (0,7.0) -- node[w,right,pos=0.25]{$14$} (0,6.6);
\draw (-3.0,6.6) -- (1.5,6.6);
\draw[->] (-1.5,6.6) -- node[w,left]{$\ll 8$} (-1.5,5.97);
\draw[->] ( 1.5,6.6) -- node[w,right]{pass} ( 1.5,5.97);
\node[nor] (n3) at (-4.2,6.6) {NOR};
\draw[->] (-3.0,6.6) -- node[w,above]{$8$} (n3.east);
\node[mux] (m3) at (0,5.6) {$14\times$ 2:1 mux \quad $\ll 2^3$};
\node[w] at (-1.5,5.82) {1}; \node[w] at (1.5,5.82) {0};
\draw[-] (n3.south) -- (-4.2,5.6);
\draw[->] (-4.2,5.6) -- (m3.west);
\draw[-] (-4.2,5.6) -- (-6.5,5.6);
\draw[-] (-6.5,5.6) -- (-6.5,-0.85);
\node[w] at (-6.5,5.85) {$c_3$};

% ---------- level 2 : shift by 4 ----------
\draw[-] (0,5.25) -- node[w,right,pos=0.25]{$14$} (0,4.85);
\draw (-3.0,4.85) -- (1.5,4.85);
\draw[->] (-1.5,4.85) -- node[w,left]{$\ll 4$} (-1.5,4.22);
\draw[->] ( 1.5,4.85) -- node[w,right]{pass} ( 1.5,4.22);
\node[nor] (n2) at (-4.2,4.85) {NOR};
\draw[->] (-3.0,4.85) -- node[w,above]{$4$} (n2.east);
\node[mux] (m2) at (0,3.85) {$14\times$ 2:1 mux \quad $\ll 2^2$};
\node[w] at (-1.5,4.07) {1}; \node[w] at (1.5,4.07) {0};
\draw[-] (n2.south) -- (-4.2,3.85);
\draw[->] (-4.2,3.85) -- (m2.west);
\draw[-] (-4.2,3.85) -- (-6.2,3.85);
\draw[-] (-6.2,3.85) -- (-6.2,-0.85);
\node[w] at (-6.2,4.10) {$c_2$};

% ---------- level 1 : shift by 2 ----------
\draw[-] (0,3.50) -- node[w,right,pos=0.25]{$14$} (0,3.10);
\draw (-3.0,3.10) -- (1.5,3.10);
\draw[->] (-1.5,3.10) -- node[w,left]{$\ll 2$} (-1.5,2.47);
\draw[->] ( 1.5,3.10) -- node[w,right]{pass} ( 1.5,2.47);
\node[nor] (n1) at (-4.2,3.10) {NOR};
\draw[->] (-3.0,3.10) -- node[w,above]{$2$} (n1.east);
\node[mux] (m1) at (0,2.10) {$14\times$ 2:1 mux \quad $\ll 2^1$};
\node[w] at (-1.5,2.32) {1}; \node[w] at (1.5,2.32) {0};
\draw[-] (n1.south) -- (-4.2,2.10);
\draw[->] (-4.2,2.10) -- (m1.west);
\draw[-] (-4.2,2.10) -- (-5.9,2.10);
\draw[-] (-5.9,2.10) -- (-5.9,-0.85);
\node[w] at (-5.9,2.35) {$c_1$};

% ---------- level 0 : shift by 1 ----------
\draw[-] (0,1.75) -- node[w,right,pos=0.25]{$14$} (0,1.35);
\draw (-3.0,1.35) -- (1.5,1.35);
\draw[->] (-1.5,1.35) -- node[w,left]{$\ll 1$} (-1.5,0.72);
\draw[->] ( 1.5,1.35) -- node[w,right]{pass} ( 1.5,0.72);
\node[nor] (n0) at (-4.2,1.35) {NOT};
\draw[->] (-3.0,1.35) -- node[w,above]{$1$} (n0.east);
\node[mux] (m0) at (0,0.35) {$14\times$ 2:1 mux \quad $\ll 2^0$};
\node[w] at (-1.5,0.57) {1}; \node[w] at (1.5,0.57) {0};
\draw[-] (n0.south) -- (-4.2,0.35);
\draw[->] (-4.2,0.35) -- (m0.west);
\draw[-] (-4.2,0.35) -- (-5.6,0.35);
\draw[-] (-5.6,0.35) -- (-5.6,-0.85);
\node[w] at (-5.6,0.60) {$c_0$};

% ---------- outputs ----------
\draw[->] (0,0.0) -- node[w,right,pos=0.35]{$14$} (0,-1.15);
\node at (0,-1.42) {$R$};
\draw (-6.5,-0.85) -- (-5.6,-0.85);
\draw[->] (-6.05,-0.85) -- node[w,right]{$4$} (-6.05,-1.15);
\node at (-6.05,-1.42) {$C$};

\node[w,align=left,anchor=west] at (2.9,3.6)
  {$w_X=w_R=14$\\ $S_{\max}=14$, $w_C=4$\\[3pt]
   level $j$:\\ \ $c_j=\mathrm{NOR}(\text{top }2^j)$\\ \ then $\ll 2^j$ if $c_j$\\[3pt]
   $C=c_3c_2c_1c_0$\\ $4\times14=56$ 1-bit muxes\\ $8{+}4{+}2{+}1=15$ NOR inputs};
\end{circuitikz}
\end{document}
```

*After Fig. 10.15, p. 324. The level-0 "NOR" is over a single bit, so it degenerates to an inverter.*

**The obvious normalizer wires a counter's output into a shifter's control input, and that is two full latencies in series.** A normalizer takes $X$ on $w_X$ bits, counts its leading zeroes into $C$ on $w_C=\lceil\log_2(w_X+1)\rceil$ bits, and left-shifts by that count so the leading one lands on the MSB of $R$ on $w_R$ bits ([[Normalizers]]). The naive composition is an [[Leading Zero Counters|LZC]] followed by a left [[Barrel Shifters|barrel shifter]] with $S=C$; it is pipelinable and constant-latency, but the shifter cannot start until $C$ is complete, so its $w_C$ mux levels are stacked on top of the LZC's whole delay. Fusing removes that stacking, and whether fusing is *possible* depends entirely on the order in which the LZC's output bits become available.

**Only the naive LZC emits its count bits in an order a shifter can consume.** The two logarithmic constructions — [[Oklobdzija LZC Tree|Oklobdzija's tree]] and [[Monotonic String Leading Zero Counter|monotonic string conversion]] — evaluate an associative reduction over a balanced binary tree, so every bit of $C$ resolves at the root, simultaneously, at the very end; there is nothing to overlap with (p. 325). The naive LZC is the *unbalanced* association of that same operator, and its serial structure is exactly what makes it useful here: it decides $c_{w_C-1}$ first, from a single wide NOR over the top half of $X$, and only then recurses. Bits arrive **MSB-first**. A left shifter is free to order its stages however it likes, because $(\mathbb{N},+)$ is commutative and shift composition is associative ([[Shifters]]) — so order the stages largest-shift-first and the two orders coincide. Each count bit is consumed by the very stage that produced it.

**One level, stated exactly.** Write $X^{(w_C)}=X$ for the input word and $X^{(j)}$ for the word leaving level $j$; every $X^{(j)}$ is $w_X$ bits wide, because this is a barrel shifter and the word never grows. Level $j$ computes

$$c_j=\mathrm{NOR}\big(x^{(j+1)}_{w_X-1},\dots,x^{(j+1)}_{w_X-2^j}\big),\qquad X^{(j)}=\begin{cases}X^{(j+1)}\ll 2^j,& c_j=1\\[2pt] X^{(j+1)},& c_j=0\end{cases}$$

so $c_j$ is one wide NOR over the top $2^j$ bits and the shift is one row of $w_X$ 1-bit 2:1 multiplexers driven by it, with $2^j$ zeroes fed in at the bottom. $R=X^{(0)}$ and $C=c_{w_C-1}\ldots c_0$ on $w_C$ bits.

**The correctness argument is a single invariant, and it is why the widths halve.** Claim: for $X\ne0$, on entry to level $j$ the leading one of $X^{(j+1)}$ lies within its top $2^{j+1}$ positions. It holds on entry to the top level $j=w_C-1$ because $2^{w_C}\ge w_X$ by the definition of $w_C$, i.e. the whole word. For the step, split those top $2^{j+1}$ positions into an upper half of $2^j$ and a lower half of $2^j$. The NOR asks precisely "is the upper half empty?". If $c_j=0$ the leading one is already in the top $2^j$ and the pass-through preserves that. If $c_j=1$ the leading one is in the lower half, at a distance between $2^j$ and $2^{j+1}$ from the top, and shifting left by exactly $2^j$ moves it into the top $2^j$. Either way the invariant holds for level $j-1$ with the bound halved, and at $j=0$ "within the top $1$ position" means the leading one is on the MSB — which is normalization. The accumulated distance is $\sum_j c_j2^j$, which is $C$ read as an unsigned integer, so $R=X\ll C$ with $C$ the leading-zero count. **The binary expansion of the count is not encoded and then decoded; it is generated one digit at a time by the same case split that performs the shift.**

> [!note] The multiplexer is shared, so fusion is free in delay against the counter and free in area against the shifter
> The naive LZC already contains a multiplexer per level — the one that chooses whether to recurse into $X_H$ or $X_L$, i.e. which half-window survives. Selecting a half-window *is* a shift of that window by $2^j$. The fused normalizer changes nothing about the control logic and only widens that existing multiplexer from the $2^j-1$ bits the counter needed to the full $w_X$ bits the datapath needs. So against a standalone naive LZC, the entire shifter costs **zero extra levels of delay** and only the extra mux width; against a standalone barrel shifter, the entire leading-zero counter costs **zero extra multiplexers** and only $2^{w_C}-1$ NOR gate inputs. Neither half is paid for twice, which is the whole reason the architecture exists.

**Cost, with every row derived from the two components' own formulas.** The naive LZC costs $w_X-w_C$ 1-bit muxes and the same count of 2-input NORs, at delay $d_k=k(k+1)/2$ levels for $k=w_C$, because the NOR at level $j$ is a tree of depth $j$ over $2^j$ bits and the levels are strictly serial (pp. 319–320). A left barrel shifter costs $w_Xw_C$ muxes at depth $w_C$ (p. 315).

| Architecture, $w_X$ bits | 1-bit muxes | NOR inputs | Levels of delay | $w_X=14$, $w_C=4$ |
| --- | --- | --- | --- | --- |
| Naive LZC alone | $w_X-w_C$ | $w_X-w_C$ | $\tfrac{w_C(w_C+1)}{2}$ | 10 muxes, 10 levels |
| Left barrel shifter alone | $w_Xw_C$ | — | $w_C$ | 56 muxes, 4 levels |
| Naive LZC **then** shifter | $w_Xw_C+w_X-w_C$ | $w_X-w_C$ | $\tfrac{w_C(w_C+1)}{2}+w_C$ | 66 muxes, 14 levels |
| **Fused** | $w_Xw_C$ | $2^{w_C}-1$ | $\tfrac{w_C(w_C+1)}{2}$ | 56 muxes, 10 levels |

Area is therefore $O(w_X\log_2 w_X)$ and delay $O\big((\log_2 w_X)^2\big)$ (p. 325) — the quadratic-in-the-logarithm delay is inherited wholesale from the naive LZC, and buying it back would mean using a logarithmic LZC, which is exactly what cannot be fused. Fusion saves $w_C$ mux levels and $w_X-w_C$ muxes against the series composition; it does **not** improve the asymptotics.

**On FPGAs the delay bound is pessimistic, and that is why this architecture wins there.** The $O(\log^2)$ figure counts each wide NOR as a gate tree of depth $j$. On an FPGA a wide OR/NOR is not built as a tree at all — it maps onto the fast carry chain, whose delay is far below the logarithm of its width — so the practical delay collapses towards $\log_2 w_X$, i.e. towards just the mux levels (p. 325). This is the same reason the naive LZC is the preferred LZC on FPGA in the first place (p. 320): wide [[Lookup-Tables|LUTs]] plus fast carry are precisely what its wide NORs want, and it is the only LZC variant that merges with a shifter at all ([[FPGAs]]).

> [!warning] The book gives no LUT count or measured delay for the fused form
> §10.3 states the asymptotics and the FPGA carry-chain remark but reports no synthesis figures, and no equivalent of the 6-LUT-as-4:1-mux folding that halves a plain barrel shifter's depth (p. 314). That folding is not obviously available unchanged here: in a barrel shifter every $s_i$ is known up front, whereas $c_j$ is a function of level $j{+}1$'s output, so the levels are serially dependent through their *select* signals and not only through their data. Quantifying this needs outside research or a synthesis run.

**Worked example, $w_X=w_R=14$, $S_{\max}=14$, $w_C=4$.** Take $X=00000010011011_2=155$, whose leading one sits at bit 7, so six leading zeros.

| Level $j$ | Top $2^j$ bits of the incoming word | $c_j$ | Action | Word after level |
| --- | --- | --- | --- | --- |
| — | — | — | — | $00000010011011$ |
| $j=3$ | $00000010$ | $0$ | pass | $00000010011011$ |
| $j=2$ | $0000$ | $1$ | $\ll4$ | $00100110110000$ |
| $j=1$ | $00$ | $1$ | $\ll2$ | $10011011000000$ |
| $j=0$ | $1$ | $0$ | pass | $10011011000000$ |

$C=c_3c_2c_1c_0=0110_2=6$ and $R=10011011000000_2=9920=155\cdot2^6$. Note that the invariant is visible in the middle column: the window the NOR inspects halves at every row, $8\to4\to2\to1$, and the leading one is inside the top $2^{j+1}$ bits every time the row begins.

$$\boxed{\ c_j=\mathrm{NOR}\big(\text{top }2^j\text{ bits of }X^{(j+1)}\big),\quad X^{(j)}=c_j\,?\,\big(X^{(j+1)}\ll2^j\big):X^{(j+1)},\quad R=X^{(0)},\ \ C=\sum_{j=0}^{w_C-1}c_j2^j\ }$$

**When it breaks.**

- **IEEE-754, immediately.** Subnormal support requires *arithmetic* on the count — comparing it against the available exponent range and clamping the shift — and the fused form has no place to do arithmetic, because the count only exists distributed across $w_C$ wires that have already been spent. Use it for application-specific formats without subnormals: FloPoCo's Nfloat, posits, and the internals of elementary function evaluators (p. 324, [[Floating-Point Formats]]). Inside a standard [[Floating-Point Operators|floating-point adder or FMA]], build the LZC and the shifter separately and keep the count addressable.
- **$X=0$ has no normal form and the circuit says so out of band.** All $w_C$ NORs fire, giving $C=2^{w_C}-1$. For $w_X=14$ that is $15$, one more than the true leading-zero count $14$ of an all-zero word, so $C$ is not a leading-zero count in this case at all — it is a saturation code. Downstream must special-case zero regardless, since a zero significand cannot be normalized, but do not assume $C\le w_X$.
- **$w_C$ is not a free parameter.** The levels shift by $2^{w_C-1},\dots,1$, summing to $2^{w_C}-1$, so $S_{\max}$ is forced to $2^{w_C}-1\ge w_X$ rather than chosen. Unlike a general shifter, where $S_{\max}$ is the parameter and $w_S$ is derived ([[Exact Full Shifter]]), here the count width fixes everything.
- **$w_R<w_X$ needs a sticky bit.** Converting a wide fixed-point number to a more compact floating-point one discards low bits, and round-to-nearest-even cannot then distinguish a tie from a value above it. OR the doomed bits into $\sigma$ inside the levels, exactly as in [[Shifter with Sticky Bit Computation]] ([[Error Accuracy]], [[Rounding]]). $w_R>w_X$ is meaningless — a normalizer removes information from $X$ to encode it more compactly in $C$ (p. 323).
- **Large $w_X$ on ASIC.** The $O(\log^2)$ delay is real without a fast carry chain to hide the wide NORs. Past roughly $w_C=6$ the series composition of a *logarithmic* LZC and a shifter wins on delay despite paying both latencies, and [[Leading Zero Anticipation]] wins outright by removing the LZC from the critical path altogether.
- **Not the cheapest, only the cheapest constant-latency one.** A while-loop shifting one bit per cycle while the MSB is zero is far smaller ([[Sequential Normalizer]]), but it is variable-latency and unpipelinable — fine behind a state machine, useless in a datapath.

**RTL (Spade).**

```spade
/// Fused normalizer: naive LZC merged into a left barrel shifter.
/// Level j (D = 2^j) NORs the top D bits of the running word to get c_j,
/// then shifts left by D under c_j. Levels run K-1 .. 0, so c is emitted
/// MSB-first — the order the shift levels want to consume it.
fn fnorm<#uint W, #uint K, #uint D>(a: [bool; W]) -> ([bool; W], [bool; K]) {
    gen if K == 0 {
        (a, [])
    } else {
        let (lo, hi) = a.split_at::<{W - D}>();
        let c = !hi.reduce_or();
        let y = if c { [false; D].concat(lo) } else { a };
        let (r, cl) = fnorm::<W, {K - 1}, {D / 2}>(y);
        (r, cl.concat([c]))
    }
}

entity normalizer14(x: uint<14>) -> (uint<14>, uint<4>) {
    let (r, c) = fnorm::<14, 4, 8>(x.as_bits());
    (r.as_uint(), c.as_uint())
}
```

`split_at::<{W - D}>()` is the tap in the diagram: Spade packs `[T; N]` with element 0 in the **least**-significant position, so `hi` is the top $D$ bits going to the NOR box and `lo` is everything below it. `!hi.reduce_or()` is that NOR, `c` is $c_j$, and `[false; D].concat(lo)` is the mux's `1` input — for arrays `concat` puts its left operand **low**, so this is $D$ zeroes fed in at the bottom and is a left shift. Every intermediate word is `[bool; W]` because $D+(W-D)=W$, which is $w_R=w_X$ expressed as a type. `D` halves per level, `{D / 2}`, walking the stages largest-shift-first; `cl.concat([c])` reassembles $C$ with $c_0$ at index 0, so the MSB-first *production* order and the LSB-at-index-0 *storage* order are reconciled once, here, rather than at every level. Everything is combinational — no `reg`, no clock port — and synthesis will not build four literal mux rows: on FPGA the wide NORs become carry-chain reductions, which is the entire delay argument above and is invisible in the drawing.

Simulated against a behavioural reference — the [[Sequential Normalizer|while-loop normalizer]], `while (r[13]==0) begin r=r<<1; c=c+1; end` — over **all 16384** 14-bit inputs, plus 3000 random vectors and 9 named ones including the bit-reversal-asymmetric pair $X=1$ (giving $C=13$, $R=2^{13}$) and $X=2^{13}$ (giving $C=0$). All pass. Only $X=0$ is hard-coded in the reference, since the loop does not terminate there.

**Related Notes.**

- [[Normalizers]] – extends: the generic normalizer interface — $w_X$, $w_R$, $S_{\max}$, and what to count — of which this is the fused implementation.
- [[Leading Zero Counters]] – depends-on: the naive LZC whose MSB-first, serially-decided output bits are the precondition for fusing at all.
- [[Barrel Shifters]] – depends-on: the other half, and the source of the stage-ordering freedom that lets the shift levels run largest-first.
- [[Oklobdzija LZC Tree]] – counter-example: logarithmic delay, but all count bits resolve at the root simultaneously, so nothing overlaps with the shift.
- [[Monotonic String Leading Zero Counter]] – counter-example: same objection, plus the prefix-OR is over $X$ rather than over a running word.
- [[Sequential Normalizer]] – compares: strictly cheaper and variable-latency, and the behavioural model this note's RTL is checked against.
- [[Leading Zero Anticipation]] – compares: the other route off the critical path, predicting the count from the addends instead of fusing it into the shift.
- [[Shifter with Sticky Bit Computation]] – extends: what to add when $w_R<w_X$ and the discarded low bits must still influence rounding.
- [[Leading Bit Counter]] – extends: counting the leading *sign* bit instead of zeroes, which is one generator parameter and no structural change.
- [[Floating-Point Operators]] – supports: where a normalizer sits, and why the IEEE-754 ones cannot use this variant.
- [[Floating-Point Formats]] – supports: the subnormal-free formats — Nfloat, posits — that this is for.
- [[Lookup-Tables]] – supports: the wide-LUT-plus-carry-chain mapping behind the FPGA delay claim.
- [[Choosing a Shifter]] – compares: where this sits against every sibling in the topic.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.3 Normalizer (combined LZC + shifter), p. 323 — the definition, Fig. 10.13 (counting zeroes vs. counting the sign bit), Fig. 10.14 (generator interface), why $w_R>w_X$ is meaningless and why $w_R<w_X$ needs a sticky bit.
- Fig. 10.15, p. 324 — architecture of a 14-bit combined leading zero counter and left shifter; redrawn above.
- §10.3, p. 324 — the IEEE-754 / subnormal restriction and the application-specific formats that remain (Nfloat, posits, elementary function internals); the while-loop normalizer as the cheapest variable-latency alternative.
- §10.3, p. 325 — logarithmic LZCs produce all count bits in parallel and so cannot be overlapped; the naive LZC's MSB-first order matching the shift levels; $O(w_X\log_2 w_X)$ area, $O((\log_2 w_X)^2)$ delay, and the fast-carry-logic NOR argument bringing FPGA delay closer to $\log_2 w_X$.
- §10.2.1, pp. 319–320 — naive LZC mux/NOR counts and the $d_k=k(k+1)/2$ delay recurrence used in the cost table; why the naive LZC is preferred on FPGA.
- §10.1.4, pp. 314–315 — barrel shifter mux count and depth, the other row of the cost table.

> [!warning] PDF page offset in Chapter 10 is +19, not +22
> The brief states PDF page = printed page + 22 (verified at PDF 129 = printed 107). In this chapter the offset is **+19**, as an earlier note in this folder also found: PDF 343 renders printed 324, PDF 344 renders printed 325. Every page cited above was read at +19 with the printed folio checked on the rendered page.
