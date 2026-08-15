---
title: Barrel Shifters
description: "The w_X=w_R case: every stage the same width, w_X*ceil(log2(S_max+1)) 1-bit muxes at log depth, uniform fanout on every s_i — the ALU shifter, necessarily truncated."
kind: circuit
source: "ASA §10.1.4, pp. 314-315"
status: seed
spade: simulated
tags: [digital, shifters]
aliases:
  - Barrel Shifter
  - Rectangular Shifter
  - Barrel Shifters
---

# Barrel Shifters

A barrel shifter is the shifter whose output is no wider than its input, $w_R=w_X$, so the word never grows as it passes down the mux stack and every stage is identical in width, cost and fanout.

```tikz title="16-bit right barrel shifter, S_max = 15, LSB-first stage order"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  str/.style={font=\scriptsize\ttfamily,inner sep=1pt},
  mux/.style={draw,fill=black!5,rounded corners=1pt,minimum width=88mm,minimum height=6mm,inner sep=1pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
\node at (0,8.35) {$X$};
\draw[-] (0,8.15) -- node[w,right]{$16$} (0,7.75);

% ---- stage 0 : shift by 1 ----
\draw (-3.3,7.75) -- (3.3,7.75);
\draw[->] (-3.3,7.75) -- (-3.3,7.42);
\draw[->] ( 3.3,7.75) -- ( 3.3,7.42);
\node[str] (l0) at (-3.3,7.25) {{\color{blue}0}xxxxxxxxxxxxxxx{\color{red}x}};
\node[str] (r0) at ( 3.3,7.25) {xxxxxxxxxxxxxxxx};
\draw[->] (-3.3,7.08) -- (-3.3,6.83);
\draw[->] ( 3.3,7.08) -- ( 3.3,6.83);
\node[mux] (m0) at (0,6.55) {};
\node[w] at (-3.3,6.55) {1}; \node[w] at (3.3,6.55) {0};
\node at (-5.6,6.55) {$s_0$}; \draw[->] (-5.3,6.55) -- (m0.west);

% ---- stage 1 : shift by 2 ----
\draw[-] (0,6.27) -- node[w,right]{$16$} (0,5.85);
\draw (-3.3,5.85) -- (3.3,5.85);
\draw[->] (-3.3,5.85) -- (-3.3,5.52);
\draw[->] ( 3.3,5.85) -- ( 3.3,5.52);
\node[str] (l1) at (-3.3,5.35) {{\color{blue}00}xxxxxxxxxxxxxx{\color{red}xx}};
\node[str] (r1) at ( 3.3,5.35) {xxxxxxxxxxxxxxxx};
\draw[->] (-3.3,5.18) -- (-3.3,4.93);
\draw[->] ( 3.3,5.18) -- ( 3.3,4.93);
\node[mux] (m1) at (0,4.65) {};
\node[w] at (-3.3,4.65) {1}; \node[w] at (3.3,4.65) {0};
\node at (-5.6,4.65) {$s_1$}; \draw[->] (-5.3,4.65) -- (m1.west);

% ---- stage 2 : shift by 4 ----
\draw[-] (0,4.37) -- node[w,right]{$16$} (0,3.95);
\draw (-3.3,3.95) -- (3.3,3.95);
\draw[->] (-3.3,3.95) -- (-3.3,3.62);
\draw[->] ( 3.3,3.95) -- ( 3.3,3.62);
\node[str] (l2) at (-3.3,3.45) {{\color{blue}0000}xxxxxxxxxxxx{\color{red}xxxx}};
\node[str] (r2) at ( 3.3,3.45) {xxxxxxxxxxxxxxxx};
\draw[->] (-3.3,3.28) -- (-3.3,3.03);
\draw[->] ( 3.3,3.28) -- ( 3.3,3.03);
\node[mux] (m2) at (0,2.75) {};
\node[w] at (-3.3,2.75) {1}; \node[w] at (3.3,2.75) {0};
\node at (-5.6,2.75) {$s_2$}; \draw[->] (-5.3,2.75) -- (m2.west);

% ---- stage 3 : shift by 8 ----
\draw[-] (0,2.47) -- node[w,right]{$16$} (0,2.05);
\draw (-3.3,2.05) -- (3.3,2.05);
\draw[->] (-3.3,2.05) -- (-3.3,1.72);
\draw[->] ( 3.3,2.05) -- ( 3.3,1.72);
\node[str] (l3) at (-3.3,1.55) {{\color{blue}00000000}xxxxxxxx{\color{red}xxxxxxxx}};
\node[str] (r3) at ( 3.3,1.55) {xxxxxxxxxxxxxxxx};
\draw[->] (-3.3,1.38) -- (-3.3,1.13);
\draw[->] ( 3.3,1.38) -- ( 3.3,1.13);
\node[mux] (m3) at (0,0.85) {};
\node[w] at (-3.3,0.85) {1}; \node[w] at (3.3,0.85) {0};
\node at (-5.6,0.85) {$s_3$}; \draw[->] (-5.3,0.85) -- (m3.west);

\draw[->] (0,0.57) -- node[w,right]{$16$} (0,0.1);
\node at (0,-0.12) {$R$};

\node[w,align=left,anchor=west] at (5.9,4.65)
  {$w_X=w_R=16$\\ $S_{\max}=15$, $w_S=4$\\ $16\times4=64$ 1-bit muxes\\ depth $=4$\\[2pt]
   {\color{blue}blue}: zero padding\\ {\color{red}red}: discarded};
\end{circuitikz}
\end{document}
```

*After Fig. 10.6, p. 315.*

**Pin the output width to the input width and the stage stack stops growing.** Every shifter is the same construction: expand the distance in binary, $S=\sum_{i=0}^{w_S-1}s_i2^i$ with $s_i\in\{0,1\}$, and apply the **associativity of function composition** to factor $\sigma^S$ — where $\sigma$ is shift-by-one — into $w_S$ independent conditional shifts, one per bit of $S$ ([[Shifters]]). Each factor $\sigma^{s_i2^i}$ is identity or a hardwired shift by $2^i$, so it costs one row of 1-bit 2:1 multiplexers driven by $s_i$. What makes the row *widths* differ between shifter families is only what happens to the bits that fall off the end. An [[Exact Full Shifter]] keeps them, so the word grows by $2^i$ pad bits at every stage and the rows get progressively wider. A barrel shifter throws them away — $X$ is $w_X$ bits, $R$ is $w_R=w_X$ bits, and the intermediate word is $w_X$ bits at every one of the $w_S$ levels.

**That single constraint fixes the cost exactly.** With $w_S=\lceil\log_2(S_{\max}+1)\rceil$ rows of $w_X$ muxes each, and no growth to account for,

$$\text{1-bit muxes}=w_X\lceil\log_2(S_{\max}+1)\rceil,\qquad \text{depth}=\lceil\log_2(S_{\max}+1)\rceil\ \text{mux levels}$$

For the 16-bit shifter of the figure, $S_{\max}=15$ so $w_S=4$: $16\times4=64$ 1-bit muxes at depth 4. Note that $S_{\max}$, not $w_S$, is the generator's parameter — real requirements are rarely of the form $2^{w_S}-1$ — and that the shift distance $S$ enters on $w_S$ bits while $X$ and $R$ are both $w_X$ bits wide. Padding is with constant zeroes here, so the mux inputs fed by pad bits degenerate to AND gates and part of the $w_X w_S$ count is cheaper than a full mux; an arithmetic right shift instead pads with $x_{w_X-1}$, which is a wire, not a gate ([[Number Formats]]).

**Because the stages are now identical, the ordering freedom is pure timing.** Commutativity of $(\mathbb{N},+)$ already said the $w_S$ factors could be permuted without changing $R$; in an exact full shifter that permutation *also* changes the total mux count, because the wide stages want to be last. Here it does not: every permutation costs exactly $w_X w_S$ muxes and gives every $s_i$ the same fanout $w_X$. The order is therefore chosen for one reason only, and Fig. 10.6's LSB-first order still wins it: $S$ usually comes out of an adder or a subtractor, carry propagation resolves the **low** bits of $S$ first, so stage 0 can start shifting while the high bits of $S$ are still settling. The overlap is free, and it means the adder computing $S$ need not itself be a fast one ([[Adders]]).

> [!note] Everything a barrel shifter still has to decide is a schedule
> Fixing $w_R=w_X$ collapses the area question — there is exactly one mux count, $w_X\lceil\log_2(S_{\max}+1)\rceil$, and no arrangement beats it. What is left over is the stage *schedule*, and the two consumers pull it in opposite directions: overlap with the adder producing $S$ wants smallest shift first, while incremental sticky-bit accumulation wants largest shift first so the widest OR starts at $t=0$ ([[Shifter with Sticky Bit Computation]]). Pick by which one is on your critical path; the silicon bill is identical either way.

**The flat alternative has the same depth and loses anyway.** Instead of $w_S$ chained 2:1 rows, decode $S$ one-hot and give each output bit a single $(S_{\max}{+}1)$:1 multiplexer. Asymptotic *depth* is comparable — one AND level plus a $\lceil\log_2(S_{\max}{+}1)\rceil$-deep OR tree — but the area is $w_X\cdot S_{\max}$ 2:1-equivalents rather than $w_X\log_2 S_{\max}$, and every bit $x_i$ now drives $S_{\max}$ AND gates instead of $w_S$ mux inputs. At $w_X=16$ that is 240 cells and fanout 15 against 64 cells and fanout 4. It is never competitive above trivial widths ([[One-Hot Shifter]]).

**On FPGAs the depth halves before you do anything.** A 6-input [[Lookup-Tables|LUT]] realises a 4:1 multiplexer — four data inputs plus two selects — so two successive rows of 2:1 muxes fold into one row of 6-LUTs. A 16-bit barrel shifter becomes 32 LUTs at logic depth 2 rather than 64 muxes at depth 4. The back-end tools find this themselves; [[FloPoCo]] emits plain 2:1 muxes and lets them. The trap is pipelining: registers placed on *every* level split the pairs and defeat the merge, so pipeline a shifter every **other** level (p. 314). On ASIC no such folding happens and the depth is the full $\lceil\log_2(S_{\max}+1)\rceil$ ([[FPGAs]]).

**Worked example — 8-bit right barrel shifter, $w_X=w_R=8$, $S_{\max}=7$, $w_S=3$.**

$$X=10110101_2=181,\qquad S=5=s_2s_1s_0=101_2$$

| Stage | $s_j$ | Action | Bits discarded | Word after stage |
| --- | --- | --- | --- | --- |
| — | — | — | — | $10110101$ |
| $j=0$ | 1 | $\gg1$ | $1$ | $01011010$ |
| $j=1$ | 0 | pass | — | $01011010$ |
| $j=2$ | 1 | $\gg4$ | $1010$ | $00000101$ |

$R=00000101_2=5$, and the discarded sets reassemble to $\{1\}\cup\varnothing\cup\{1010\}=10101$, exactly the low five bits of $X$ — as the binary decomposition promised, each bit of $X$ is discarded by exactly one stage. Reversing the stage order to $\gg4,\ \text{pass},\ \gg1$ gives $10110101\to00001011\to00000101$: identical $R$, which is the commutativity claim made concrete.

**Truncation is the price of $w_R=w_X$, and it is above half an ulp.** Exactly, $181/2^5=5.65625$; the shifter returns $5$, an error of $0.65625$ ulp of $R$. A barrel shifter is therefore only **faithful**, never correctly rounded, and no choice of stage order changes that — the information left with the discarded bits. Recovering round-to-nearest needs the round bit $r=x_4$ and the sticky $\sigma=\bigvee_{i<4}x_i$; here $r=1,\sigma=1$ means "strictly above the midpoint", so rounding gives $6$ and error $0.34375\le\tfrac12$ ulp ([[Error Accuracy]], [[Rounding]]). Without $\sigma$ that case is indistinguishable from an exact tie.

$$\boxed{\ w_R=w_X\ \Longrightarrow\ \text{muxes}=w_X\lceil\log_2(S_{\max}+1)\rceil,\quad \text{depth}=\lceil\log_2(S_{\max}+1)\rceil,\quad \text{fanout}(s_i)=w_X\ }$$

| Variant, $w_X=w_R=n$, $S_{\max}=n-1$ | 1-bit muxes | Depth | $n=16$ |
| --- | --- | --- | --- |
| Barrel shifter | $n\log_2 n$ | $\log_2 n$ | 64 muxes, depth 4 |
| Barrel shifter on 6-LUTs | $\tfrac12 n\log_2 n$ LUTs | $\tfrac12\log_2 n$ | 32 LUTs, depth 2 |
| One-hot ($n$:1 mux per output bit) | $n(n-1)$ | 1 AND $+\log_2 n$ OR | 240 cells, fanout 15 per $x_i$ |

**When it breaks.**

- **Accuracy.** Truncation alone costs up to 1 ulp of $R$. Any operator that must round correctly needs the sticky bit computed inside the stages, not a wider shifter.
- **Out-of-range distances.** With $S_{\max}=2^{w_S}-1$ every encodable $S$ is legal and $R=0$ for $S\ge w_X$ falls out for free. When $S_{\max}<2^{w_S}-1$ the excess codes are don't-cares only if the caller guarantees $S\le S_{\max}$; otherwise detecting the overflow is an explicit comparison against a constant ([[Comparators]]). ISAs differ here — some saturate to zero, some mask $S$ modulo $w_X$, and masking is free while saturating is not.
- **Bidirectionality.** A runtime direction bit doubles the mux inputs. Bias $S$ by the largest right shift instead and build one direction ([[Bidirectional Shifter]]).
- **Small $S_{\max}$.** Below about $S_{\max}=3$ the $\log$ advantage has nothing to work with and a flat one-hot mux is the same circuit; the asymptotics only start paying at $w_S\ge3$.
- **A free DSP block changes the answer.** A left shift is a multiplication by $2^S$, so a one-hot decode feeding a hard multiplier can beat the whole LUT structure ([[Shift by Multiplier]]).
- **Sparse distance sets.** If only a handful of distances ever occur, the binary decomposition is over-general and the mux network should be optimised against that set ([[Sporadic Shifter]]).

**RTL (Spade).**

```spade
/// Right barrel shifter, w_X = w_R = W, S_max = 2^K - 1.
/// One stage per bit of S, consumed LSB-first: stage j shifts by D = 2^j.
/// Array index 0 is the LSB, so a right shift by D is "drop the low D
/// elements, refill the top with zeroes".
fn barrel_r<#uint W, #uint K, #uint D>(a: [bool; W], s: [bool; K]) -> [bool; W] {
    gen if K == 0 {
        a
    } else {
        let y = if s[0] { a[D..W].concat([false; D]) } else { a };
        barrel_r::<W, {K - 1}, {2 * D}>(y, s[1..K])
    }
}

entity barrel8(x: uint<8>, s: uint<3>) -> uint<8> {
    barrel_r::<8, 3, 1>(x.as_bits(), s.as_bits()).as_uint()
}
```

`s[0]` is the select of the top mux row in the diagram and the recursion walks down it, so the `gen if` unrolls into exactly $K$ chained rows — combinational throughout, no `reg`, no clock port. The `if` is the $W$-wide mux row; `a[D..W].concat([false; D])` is its `1` input, the hardwired shift, and `a` is its `0` input. Widths never move: `a` is `[bool; W]` at every level because `(W-D) + D = W`, which is the $w_R=w_X$ constraint expressed as a type. `D` doubles per level, `{2 * D}`, which is the binary decomposition of $S$; `K` counts down so `barrel_r::<8,3,1>` is stages $1,2,4$. Synthesis will not build three literal mux rows on an FPGA — it will fold them pairwise into 6-LUTs as above, and on ASIC it may re-time or re-order them, both of which the drawing shows as fixed.

> [!warning] Array packing order is a silent correctness trap
> Spade packs `[T; N]` element 0 into the **least**-significant position, and for arrays `x.concat(y)` puts `x` **low** — the opposite of `concat` on integers, which puts `x` high. Get it backwards and this entity compiles clean and shifts the wrong way, which is why the simulation below uses asymmetric vectors.

Simulated against `x >> s` in Verilog: 7 named vectors including $181\gg5=5$, $129\gg1=64$, $128\gg7=1$ and $1\gg7=0$, plus 3000 random $(X,S)$ pairs. All pass.

**Related Notes.**

- [[Exact Full Shifter]] – compares: the same mux stack with $w_R=w_X+S_{\max}$, so no bit is discarded and the rows widen as they descend.
- [[Truncated Shifter]] – extends: the barrel shifter is the extreme truncated case, $w_R=w_X$, where nothing is spent keeping doomed bits alive.
- [[One-Hot Shifter]] – counter-example: same asymptotic depth, quadratic area and fanout $S_{\max}$ on every $x_i$.
- [[Shifter with Sticky Bit Computation]] – extends: recovers the OR of the bits this note throws away, computed inside the stages for free.
- [[Bidirectional Shifter]] – depends-on: why direction is a generator parameter here and not an input.
- [[Choosing a Shifter]] – compares: where this sits against every sibling in the topic.
- [[Shift by Multiplier]] – counter-example: on an FPGA with a spare DSP, a multiply by $2^S$ beats the mux network entirely.
- [[Sporadic Shifter]] – counter-example: when the needed distances are a sparse subset, the binary decomposition is the wrong factorisation.
- [[Lookup-Tables]] – supports: the 6-LUT-as-4:1-mux identity that halves both LUT count and depth.
- [[Comparators]] – depends-on: detecting $S>S_{\max}$ when the caller cannot guarantee the range.
- [[Floating-Point Operators]] – supports: the significand alignment shift, where this circuit sits on somebody else's critical path.
- [[Normalizers]] – extends: fuse a left barrel shifter with a leading zero counter and the count never has to be routed back as $S$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.1.4 Barrel shifter, p. 314 — the definition $w_R=w_X$, equal stage sizes, equal $s_i$ fanout, and why Fig. 10.6's order is still preferred.
- Fig. 10.6, p. 315 — 16-bit right barrel shifter, $S_{\max}=15$, discarded bits in red; redrawn above.
- §10.1.3 and the FPGA-specific remark, pp. 312–314 — LSB-first ordering and the adder overlap; two mux rows per 6-LUT and the every-other-level pipelining caveat.
- §10.1.5, pp. 314–316 — the sticky-bit consumer that motivates reversing the stage order.

> [!warning] PDF page offset in this file is not constant
> The brief states PDF page = printed page + 22 (verified at PDF 129 = printed 107). In Chapter 10 the offset is **+19**: PDF 334 renders printed 315, PDF 336 renders printed 317. Every page number cited above was read at the +19 offset and the printed folio was checked on the rendered page.
