---
title: Normalizers
description: "LZC wired to a left shifter: outputs the normalized word R and the count C, turning a fixed-point number into a significand plus exponent. Pipelinable and constant-latency, but two full latencies in series."
kind: circuit
source: "ASA §10.3, pp. 323-325"
status: seed
spade: simulated
tags: [digital, shifters]
aliases:
  - Normalizer
  - Normalizers
  - Combined LZC and Shifter
---

# Normalizers

A normalizer is a leading-zero counter and a left shifter sharing one input word, and it is the only shifter whose shift distance is not an input — it computes its own, and reports it.

```tikz title="Normalizer interface (count zeroes, count sign bit) and its LZC-then-shifter realization"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  blk/.style={draw,fill=black!4,rounded corners=1pt,minimum width=14mm,minimum height=8mm,inner sep=2pt},
  big/.style={draw,fill=black!4,rounded corners=1pt,minimum width=20mm,minimum height=8mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.2pt},
  capt/.style={font=\scriptsize\itshape}
]

% ---------------- (a) normalizer counting zeroes ----------------
\node at (-6.1,3.5) {$X$};
\draw[->] (-6.1,3.28) -- (-6.1,2.65);
\node[w,anchor=west] at (-6.02,2.98) {$w_X$};
\node[blk] (sa) at (-6.1,2.25) {$\ll$};
\draw[->] (-6.6,1.85) -- (-6.6,0.95);
\node[w,anchor=east] at (-6.68,1.42) {$w_C$};
\node at (-6.6,0.72) {$C$};
\draw[->] (-5.6,1.85) -- (-5.6,0.95);
\node[w,anchor=west] at (-5.52,1.42) {$w_R$};
\node at (-5.6,0.72) {$R$};
\node[capt] at (-6.1,0.15) {(a) count zeroes};

% ---------------- (b) normalizer counting the sign bit ----------------
\node at (-2.45,3.5) {$X$};
\draw[->] (-2.45,3.28) -- (-2.45,2.65);
\node[w,anchor=west] at (-2.37,2.98) {$w_X$};
\node at (-3.3,3.5) {$s$};
\draw[->] (-3.3,3.28) -- (-3.3,2.65);
\node[blk] (sb) at (-2.85,2.25) {$\ll$};
\draw[->] (-3.35,1.85) -- (-3.35,0.95);
\node[w,anchor=east] at (-3.43,1.42) {$w_C$};
\node at (-3.35,0.72) {$C$};
\draw[->] (-2.35,1.85) -- (-2.35,0.95);
\node[w,anchor=west] at (-2.27,1.42) {$w_R$};
\node at (-2.35,0.72) {$R$};
\node[capt] at (-2.9,0.15) {(b) count the sign bit $s$};

\draw[dashed,black!45] (-0.9,3.8) -- (-0.9,-0.15);

% ---------------- (c) the pipelinable realization ----------------
\node at (3.3,3.5) {$X$};
\draw (0.6,3.15) -- (5.9,3.15);
\draw (3.3,3.32) -- (3.3,3.15);
\draw[->] (1.5,3.15) -- (1.5,2.65);
\draw[->] (5.3,3.15) -- (5.3,1.45);
\node[w,anchor=west] at (1.58,2.9) {$w_X$};
\node[w,anchor=west] at (5.38,2.4) {$w_X$};

\node[big] (lzc) at (1.5,2.25) {LZC};
\node[big] (sh)  at (4.6,1.05) {$\ll$ barrel};

\draw (1.5,1.85) -- (1.5,1.05);
\draw[->] (1.5,1.05) -- (3.6,1.05);
\node[w,anchor=south] at (2.2,1.09) {$C$};
\node[w,anchor=north] at (2.2,1.01) {$w_C$};
\node[w,anchor=east] at (3.58,1.30) {$S$};
\draw[fill] (1.5,1.05) circle (1.1pt);
\draw[->] (1.5,1.05) -- (1.5,0.45);
\node at (1.5,0.22) {$C$};

\draw[dashed,black!55] (3.02,1.5) -- (3.02,0.62);
\node[w,anchor=south,black!55] at (3.02,1.5) {reg};

\draw[->] (4.6,0.65) -- (4.6,0.45);
\node at (4.6,0.22) {$R$};
\node[w,anchor=west] at (4.68,0.5) {$w_R$};

\node[capt,align=left,anchor=west] at (0.6,-0.35)
  {(c) LZC then shifter: $S\!=\!C$, $w_C=\lceil\log_2(w_X)\rceil$, two full latencies in series};
\end{circuitikz}
\end{document}
```

*Panels (a) and (b) after Fig. 10.13, p. 323; panel (c) is the realization described in prose on p. 325.*

**Read the whole circuit off its two outputs.** The input is $X$ on $w_X$ bits, and there are two results: $C$ on $w_C=\lceil\log_2(w_X)\rceil$ bits, the number of leading zeroes, and $R$ on $w_R$ bits, $X$ shifted left by exactly $C$ so that its leading one lands on the MSB. Nothing here is new — $C$ is what a [[Leading Zero Counters|leading-zero counter]] already produces and the shift is a plain left [[Barrel Shifters|barrel shifter]] — but the pair $(C,R)$ is what makes it an operator rather than two blocks: it is precisely the conversion from a [[Fixed-Point Representations|fixed-point]] number to a floating-point one, with $R$ becoming the significand and $C$ the exponent up to an additive constant ([[Floating-Point Formats]], p. 323). Every downstream use is that conversion: the output stage of a floating-point adder, the entry point of an elementary function evaluator, the packing step of any [[Floating-Point Operators|operator]] whose datapath is internally fixed-point.

**What to count is a parameter, not a property of the circuit.** Sign/magnitude floating-point formats store an unsigned significand, so the normalizer counts leading *zeroes*. Formats whose significand is two's complement — posits are the book's example — need the leading *sign bit* counted instead, since such a significand is normalized when its leading bit differs from the sign, not when it is one ([[Number Formats]]). The generator therefore takes the bit to count as an input $s$ rather than baking it in, panel (b), which is the [[Leading Bit Counter]] generalisation applied to the whole normalizer: one parameterised structure, at the cost of $s$ fanning out to every level (p. 316, p. 323).

**Four parameters fix the generator, and one of the four combinations is meaningless.** Fig. 10.14, p. 323, lists them: input size $w_X$, output size $w_R$, maximum count and shift distance $S_{\max}$, and what to count. The case $w_R>w_X$ is nonsense — a normalizer *removes* information from $X$ by encoding it into $C$, so widening $R$ pads with zeroes that carry nothing. The case $w_R<w_X$ is the useful one and it is the one that needs care: converting a wide fixed-point format to a compact floating-point one discards the bits that fall off the right of $R$, so a sticky bit — the OR of everything discarded — must come out alongside, or round-to-nearest-even cannot tell an exact tie from a value just above it and the operator loses its $\tfrac12$ ulp guarantee ([[Rounding]], [[Error Accuracy]], [[Shifter with Sticky Bit Computation]]). Inside floating-point operators the common case is simply $w_R=w_X$ (p. 323).

**The straightforward architecture pays two full latencies, and that is the whole design tension.** Wire an LZC's $C$ output to a barrel shifter's $S$ input, panel (c). It is correct, it is constant-latency, and constant latency is what makes it *pipelinable* — a register can be cut anywhere on the $C$ bus, at the dashed line, with the $X$ bus rebalanced to match. But the delay is the sum $d_{\mathrm{LZC}}+d_{\mathrm{shift}}$, with no overlap: the shifter cannot begin until the count exists. At $w_X=w_R=16$ that is a barrel shifter of $w_X\lceil\log_2(S_{\max}+1)\rceil=64$ 1-bit multiplexers at depth 4 (p. 315) sitting in series behind whichever LZC you chose, and a naive LZC's own depth is $\tfrac{k(k+1)}{2}$ for $k=w_C$, i.e. 10 mux levels at $w_X=16$ (p. 319–320).

**Whether the two halves can be overlapped is decided entirely by the order the count bits arrive in.** The two logarithmic LZCs — [[Oklobdzija LZC Tree|Oklobdzija's tree]] and [[Monotonic String Leading Zero Counter|monotonic string conversion]] — evaluate an associative reduction over a balanced tree, so *all* bits of $C$ become valid at the same instant, at the root. There is nothing to overlap: the shifter's first stage waits for the last level of the tree regardless. The naive LZC is the opposite. It is the fully unbalanced association of the same operator, one level per bit of $C$, and it emits $c_{w_C-1}$ first — MSB-first, which is exactly the order a left shifter wants its stages in when they are ordered largest-shift-first (commutativity of $(\mathbb{N},+)$ permits any stage order, so this one is free to choose). That coincidence is what the [[Fused Normalizer]] exploits, and it is why the asymptotically *worse* LZC is the right one to build a normalizer out of (p. 325).

**On FPGA the arithmetic that picks the LZC changes sign.** The naive LZC's cost is dominated by wide NORs, and a wide NOR on an FPGA is not a gate tree — it maps onto the fast carry chain, so its delay falls far below the $\log$ of its width. Its $O(\log^2 w_X)$ asymptotic is therefore misleading here, and it is the variant to pick on FPGA even before the fusion argument applies (p. 320). The shifter half benefits independently: a 6-input [[Lookup-Tables|LUT]] realises a 4:1 multiplexer, so two successive rows of 2:1 muxes fold into one row of LUTs and both the LUT count and the logic depth halve — but only if pipeline registers are placed every *other* level, since a register on every level splits the pairs and defeats the merge (p. 314, [[FPGAs]]). On ASIC neither effect exists and a logarithmic LZC wins at large $w_X$.

$$\boxed{\;C=\mathrm{LZC}(X),\qquad R=X\cdot 2^{C},\qquad r_{w_R-1}=1\iff X\neq 0\;}$$

The third clause is the specification. A normalizer's contract is not "shift by the count" but "make the MSB a one"; the count is the receipt, and it is only useful because it is exact.

**When it breaks.**

- $X=0$ has no leading one at all. Padding the LZC input on the right with **ones** makes $C$ saturate at $w_X$ instead of running off (p. 318–319), and $R=0$; but the boxed MSB property fails, so any consumer treating $R$ as a significand needs a separate zero flag. A floating-point encoder gets this from its own zero encoding; a bare datapath does not.
- $w_R<w_X$ without a sticky output is *faithful*, not correctly rounded — a half-ulp bug that random testing finds only if it checks tie cases explicitly ([[Rounding]]).
- IEEE-754 adders and FMAs cannot use the fused variant at all: subnormal support requires arithmetic on $C$ itself, and the fused form leaves nowhere to do it. The two-block form here is the one that survives, precisely because $C$ exists as a bus (p. 324).
- Two latencies in series stops being acceptable when the normalizer sits on the critical path of a floating-point adder. The escape is not a faster normalizer but [[Leading Zero Anticipation]] — predict $C$ from the addends in parallel with the addition, and the LZC leaves the critical path entirely.
- If latency is irrelevant and area is everything, none of this applies: the [[Sequential Normalizer]] is a while-loop, cheaper than any combinational variant, at the price of variable latency and no pipelining.

**RTL (Spade).**

```spade
/// Naive leading-zero counter, MSB-first: one wide NOR + one 1-bit mux per level.
fn lzc16(x: uint<16>) -> uint<4> {
    let c3 = (x >> 8) == 0;
    let u  = if c3 { x } else { x >> 8 };
    let c2 = (u >> 4) == 0;
    let v  = if c2 { u } else { u >> 4 };
    let c1 = (v >> 2) == 0;
    let w  = if c1 { v } else { v >> 2 };
    let c0 = (w >> 1) == 0;
    [c0, c1, c2, c3].as_uint()
}

/// Normalizer: LZC then left barrel shifter, C wired to the shifter's S input.
entity normalizer16(x: uint<16>) -> (uint<4>, uint<16>) {
    let c = lzc16(x);
    let r = x << zext::<4, 16>(c);
    (c, r)
}
```

`lzc16` is the LZC block of panel (c), `x << ...` is the barrel block, and `c` is the $C$ bus fanning out to both the shifter's $S$ port and the module output. Each `== 0` is one level's wide NOR and each `if` is that level's multiplexer — note that these muxes carry the surviving *window* only, which is what separates this from the fused form where the mux is $w_X$ bits wide at every level. The `zext::<4,16>` is a Spade typing rule, not hardware: shift operands must share a type, whereas the synthesised circuit routes 4 select bits into 4 mux rows. Everything is combinational; the dashed `reg` line in the diagram is where a `reg(clk)` on both `c` and `x` would go, and it is legal exactly because the latency is constant. Synthesis will not build the `<<` as a generic 16-bit shifter either — it lowers to the same $16\times4$ mux stack, folded to 32 6-LUTs at depth 2 on FPGA.

**Related Notes.**

- [[Leading Zero Counters]] – depends-on: supplies $C$, and which variant you pick decides whether this note's two-block form or the fused one is available.
- [[Barrel Shifters]] – depends-on: the left-shift half, and the source of the $w_X\lceil\log_2(S_{\max}{+}1)\rceil$ mux count.
- [[Fused Normalizer]] – extends: merges the two blocks by consuming the naive LZC's MSB-first count as it is produced, trading the $C$ bus away.
- [[Sequential Normalizer]] – compares: the same function at one bit per cycle, cheapest of all and the only variable-latency option.
- [[Leading Zero Anticipation]] – extends: removes the LZC from the critical path by predicting $C$ from the addends instead of the sum.
- [[Shifter with Sticky Bit Computation]] – supports: what the $w_R<w_X$ case needs bolted on to stay correctly rounded.
- [[Floating-Point Operators]] – supports: the consumer that gives $(C,R)$ its meaning as exponent and significand.
- [[Choosing a Shifter]] – compares: where this sits against every other member of the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.3 Normalizer (Combined LZC + Shifter), pp. 323–325 — Fig. 10.13 (interface, zeroes and sign-bit variants), Fig. 10.14 (generator parameters), the $w_R$ versus $w_X$ discussion and the sticky-bit requirement, the pipelinable LZC-then-shifter solution, and why the logarithmic LZCs cannot overlap with the shift.
- §10.1.4 Barrel shifter, pp. 314–315 — mux count and depth of the shifter half; 6-LUT folding and the every-other-level pipelining rule.
- §10.2.1 Naive LZC architecture, pp. 318–320 — padding with ones so $C$ saturates at $w_X$; the $k(k+1)/2$ delay; why the naive form is preferred on FPGA.

> [!warning] Page-offset correction, for whoever cites this chapter next
> The rule "PDF page = printed page + 22" holds only in the early chapters of
> `Dienchin.pdf`. The offset drifts downward through the volume: $+22$ at printed
> 107, $+21$ at 179, $+20$ at 280, and $+19$ from roughly printed 311 onward.
> Chapter 10's printed pages 323–325 are PDF pages 342–344, not 345–347.
