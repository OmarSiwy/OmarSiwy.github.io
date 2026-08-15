---
title: "Floating-Point Accumulator Loop"
description: "The obvious accumulator — an FP adder with its output fed back — and why it fails twice: one summand every l cycles, and error growing as (N-1)u times the sum of magnitudes."
kind: circuit
source: "ASA Ch. 21 intro, pp. 623-625; §21.3, pp. 638-639"
status: seed
spade: simulated
tags: [digital, exact-accumulators, floating-point, accumulator, error]
aliases:
  - Naive Floating-Point Accumulator
  - Naive FP Accumulator
  - FP Accumulator Loop
---

# Floating-Point Accumulator Loop

A floating-point adder with its output wired back to one of its inputs — the smallest accumulator that can be built, and the only one in this topic that rounds *inside* the feedback loop.

```tikz title="Iterative floating-point accumulation (left) and sum of products (right): the FP adder and its rounding sit inside the loop-carried path"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ======== left: iterative accumulation of a sum ========
  \node[anchor=south] at (2.6,4.62) {$X_i$};
  \draw[->] (2.6,4.6) -- (2.6,3.8);
  \node[anchor=west,scale=0.8] at (2.68,4.2) {$w_E{+}w_F{+}1$};

  \draw (1.9,3.0) rectangle (3.3,3.8);
  \node at (2.6,3.4) {$+$};
  \node[anchor=west,scale=0.75] at (3.42,3.4) {FP adder, latency $l$};

  \draw[->] (2.6,3.0) -- (2.6,2.4);
  \draw (1.9,1.6) rectangle (3.3,2.4);
  \node[scale=0.85] at (2.6,2.0) {register};

  \draw[->] (1.05,2.0) -- (1.9,2.0);
  \node[anchor=south,scale=0.75] at (1.5,2.03) {reset};

  \draw[->] (2.6,1.6) -- (2.6,1.15) -- (0.6,1.15) -- (0.6,3.4) -- (1.9,3.4);
  \node[anchor=west,scale=0.75] at (0.66,2.62) {$\hat s_{k-1}$};

  \draw[->] (2.6,1.6) -- (2.6,0.35);
  \node[anchor=west] at (2.68,0.75) {$R$};
  \node[anchor=west,scale=0.75] at (2.68,0.45) {$w'_E{+}w'_F{+}1$};

  \node[anchor=north,scale=0.8] at (2.6,0.05) {one $X_i$ every $l$ cycles};

  % ======== right: sum of products ========
  \node[anchor=south] at (8.2,5.62) {$X_i$};
  \node[anchor=south] at (9.0,5.62) {$Y_i$};
  \draw[->] (8.2,5.6) -- (8.2,5.0);
  \draw[->] (9.0,5.6) -- (9.0,5.0);

  \draw (7.9,4.2) rectangle (9.3,5.0);
  \node at (8.6,4.6) {$\times$};

  \draw[->] (8.6,4.2) -- (8.6,3.8);

  \draw (7.9,3.0) rectangle (9.3,3.8);
  \node at (8.6,3.4) {$+$};
  \node[anchor=west,scale=0.75] at (9.42,3.4) {FP adder, latency $l$};

  \draw[->] (8.6,3.0) -- (8.6,2.4);
  \draw (7.9,1.6) rectangle (9.3,2.4);
  \node[scale=0.85] at (8.6,2.0) {register};

  \draw[->] (7.05,2.0) -- (7.9,2.0);
  \node[anchor=south,scale=0.75] at (7.5,2.03) {reset};

  \draw[->] (8.6,1.6) -- (8.6,1.15) -- (6.6,1.15) -- (6.6,3.4) -- (7.9,3.4);
  \node[anchor=west,scale=0.75] at (6.66,2.55) {$\hat s_{k-1}$};

  \draw[->] (8.6,1.6) -- (8.6,0.35);
  \node[anchor=west] at (8.68,0.75) {$R$};

  \node[anchor=north,scale=0.8] at (8.6,0.05) {only the $\times$ can be pipelined};

  % ======== the point ========
  \draw[dashed,black!55] (0.35,1.0) rectangle (4.95,3.95);
  \draw[dashed,black!55] (6.35,1.0) rectangle (10.95,3.95);
  \node[anchor=north,scale=0.8,align=center] at (5.6,-0.45)
    {dashed: the loop-carried path --- every rounding of the running sum happens inside it};
\end{circuitikz}
\end{document}
```

*After Fig. 21.1, p. 624.*

**Read the circuit as a recurrence.** A register holds the running partial sum, a `reset` signal starts a new summation, and the adder combines the register with the incoming summand:

$$\hat s_0 = 0, \qquad \hat s_k = \mathrm{fl}\!\left(\hat s_{k-1} + X_k\right), \qquad R = \hat s_N$$

Both the summand $X_i$ and the register are one packed $\text{float}(w_E,w_F)$ word, $w_E+w_F+1$ bits ([[Number Formats]]); the output may be a wider $\text{float}(w'_E,w'_F)$. The sum-of-products variant differs only in what feeds the adder: $X_iY_i$ from a multiplier, which is *outside* the loop and can be pipelined as deeply as the clock demands. Everything below therefore applies to both panels — the multiplier is never the problem.

**The adder's latency is the loop's initiation interval.** A floating-point adder ([[Floating-Point Operators]]) puts an alignment shifter, a significand addition ([[Adders]]), a leading-zero count and a normalising shifter in series, and is pipelined to a latency of $l = 3\ldots5$ cycles in ASIC, up to tens of cycles on FPGA (p. 623). Because $\hat s_k$ depends on $\hat s_{k-1}$, that entire latency is a loop-carried dependency: the next summand cannot enter until the previous result emerges, so the initiation interval is $l$ and the throughput is $1/l$ summands per cycle, whatever the clock frequency. This is a property of the dependency graph, not of the implementation — no amount of extra pipelining shortens it, because pipelining *is* what makes $l$ large.

**Two escapes exist, and both buy throughput with a merge network.** If the pipeline is kept full with $l$ *independent* accumulations interleaved, the operator retires one summand per cycle — but it now holds $l$ independent sub-sums that must afterwards be added together, which costs extra hardware and only pays off when at least $l$ accumulations are available at once, as in large matrix work (p. 624). If instead $N$ is small and known at construction time, drop the loop entirely and build a tree of $N-1$ floating-point adders, of depth $\lceil\log_2 N\rceil$ (p. 623); this also cuts each summand's exposure from $N$ roundings to $\lceil\log_2 N\rceil$. Massive hardware speculation can shorten $l$ itself (Sect. 11.1.4, p. 340) at a large area cost. None of the three changes the fact that the running sum is rounded on every step.

**Expand the rounding model to get the error.** Under the standard model of [[Error Analysis]], each addition is exact-then-rounded: $\mathrm{fl}(a+b) = (a+b)(1+\delta)$ with $|\delta|\le u$, where $u = 2^{-w_F-1}$ for round-to-nearest ([[Rounding]]). Unrolling $\hat s_k = (\hat s_{k-1}+X_k)(1+\delta_k)$ and distributing the product over the sum gives

$$\hat s_N \;=\; \sum_{i=1}^{N} X_i \prod_{j=\max(i,2)}^{N} (1+\delta_j)$$

so $X_1$ is multiplied by $N-1$ error factors and $X_N$ by exactly one. Expanding each product to first order in $u$ — dropping $O(u^2)$ terms, legitimate because $Nu \ll 1$ in any regime where the circuit is useful — and applying the triangle inequality:

$$\left|\hat s_N - \sum_i X_i\right| \;\le\; (N-1)\,u\sum_i |X_i|$$

**Read what that bound does *not* say.** The right-hand side is $\sum_i|X_i|$, the sum of magnitudes, not $\bigl|\sum_i X_i\bigr|$. When the summands cancel — alternating series, a gradient reduction, a numerical integration with sign changes — the true result shrinks while the bound does not, so the *relative* error is unbounded. And the bound grows with $N$ even when every $X_i$ is exact: the inaccuracy is manufactured by the summation process itself. The pathological end of this is reached when a summand falls below half an ulp of the running sum, at which point round-to-nearest returns the running sum unchanged and the summand is discarded whole — for $N \gtrsim 2^{w_F}$ ($\approx 8.4\cdot10^6$ for binary32, with equal summands) the accumulator simply stops moving.

**Widening the significand is a fix that pays for itself twice over.** Converting a floating-point input to a wider format is cheap and always errorless, so the adder in the loop can be given a larger significand than the summands, shrinking $u$ (p. 624). But the alignment shifter, the significand adder and the normaliser all grow with the significand width, so this lengthens exactly the critical path that already limits throughput — the second failure is paid for out of the first.

> [!important] Both failures have one cause
> The latency $l$ and the factor $(N-1)u$ are not two independent defects. They are both consequences of putting a *rounding* floating-point adder in the loop: rounding is what requires the normalise-and-round back end that makes $l$ large, and rounding is what accumulates $\delta_k$. Take the rounding out of the loop — keep the accumulator in fixed point, wide enough that no summand needs to be rounded to land in it — and both disappear together. That is the whole of [[Exact Accumulators]].

**Rounding also destroys reproducibility.** $\mathrm{fl}$ discards a different set of bits depending on the magnitude of the partial sum it is applied to, so floating-point addition is not associative and $\hat s_N$ depends on the *order* in which the $X_i$ arrive. Two runs of the same reduction with a different schedule — a different number of GPU warps, a different interleaving in the $l$-way pipelined variant above — give different answers, which is why the pipelined escape restores throughput but never reproducibility.

$$\boxed{\ \text{II} = l \ \text{cycles},\qquad \left|\hat s_N - \sum_{i=1}^{N} X_i\right| \;\le\; (N-1)\,u\sum_{i=1}^{N} |X_i|\ }$$

**When it breaks — or rather, when it is fine.** The loop is the right circuit when accumulation is not the bottleneck and $N$ is small: at $N = 100$ in binary32, $(N-1)u \approx 6\cdot10^{-6}$, well inside most error budgets, and one FP adder is unbeatably cheap. It stops being fine when: $N$ is large or unknown at construction time; the summands cancel, so the $\sum|X_i|$ in the bound is much larger than the result; the summands span a wide exponent range, so small ones vanish individually rather than in aggregate; bit-exact reproducibility is required; or the design must sustain one summand per cycle, at which point $l$ decides everything. The interleaved-pipeline variant only helps if $\ge l$ independent accumulations genuinely exist — and the adder tree only if $N$ is a compile-time constant.

**RTL (Spade).** One iteration of the recurrence. The operator needs $N$ of these, one per summand, and its loop control is just the reset that clears the register — at $l > 1$ it additionally needs either a stall of $l-1$ cycles between summands or a modulo-$l$ input scheduler plus an $l$-way merge tree at the end, which is the whole cost of the interleaved variant.

```spade
/// leading-zero counter: number of significant bits of s (0 if s == 0)
fn sig_bits(s: uint<20>) -> uint<5> {
    let b = s.as_bits();
    if b[19] { 20 } else if b[18] { 19 } else if b[17] { 18 } else if b[16] { 17 }
    else if b[15] { 16 } else if b[14] { 15 } else if b[13] { 14 } else if b[12] { 13 }
    else if b[11] { 12 } else if b[10] { 11 } else if b[9] { 10 } else if b[8] { 9 }
    else if b[7] { 8 } else if b[6] { 7 } else if b[5] { 6 } else if b[4] { 5 }
    else if b[3] { 4 } else if b[2] { 3 } else if b[1] { 2 } else if b[0] { 1 }
    else { 0 }
}

/// fl(): keep 4 significant bits, round to nearest, ties to even
fn rne4(s: uint<20>) -> uint<20> {
    let n = sig_bits(s);
    if n <= 4 {
        s
    } else {
        let sh: uint<20> = zext(n - 4);
        let q = s >> sh;                          // retained significand, 4 bits
        let step: uint<20> = 1 << sh;             // one ulp at this exponent
        let half = step >> 1;
        let rem: uint<20> = s -. (q << sh);       // discarded tail
        let up = (rem > half) || ((rem == half) && q.as_bits()[0]);
        let qr: uint<20> = if up { q +. 1 } else { q };
        qr << sh
    }
}

entity fp_acc_step(clk: clock, rst: bool, x: uint<8>) -> uint<20> {
    decl next;
    reg(clk) s: uint<20> reset(rst: 0) = next;
    let sum: uint<20> = trunc(s + zext::<8, 20>(x));
    let next: uint<20> = rne4(sum);
    s
}
```

`s` is the register of the diagram and `x` is $X_i$; `sum` is the exact addition, `sig_bits` is the FP adder's leading-zero counter and `rne4` its normalise-and-round back end, so the whole `fp_acc_step` body is the `+` box plus the register inside the dashed loop. The exponent is carried by bit position in a 20-bit word instead of a packed field, which makes this a $w_F = 3$ float with no sign, no subnormals and no exceptions — enough to exhibit the loop's arithmetic, not an IEEE adder. Widths: `s + x` widens to 21 bits and is truncated back to 20 (the accumulator cannot represent its own overflow, exactly as a real one signals it); `q << sh` re-inserts the exponent that `>> sh` removed. The combinational path in the loop is add → LZC → variable right shift → round → variable left shift, which is the $l$ that synthesis will want to pipeline and cannot, because the register output feeds its own input; it closes in one cycle here only because the format is tiny.

Simulated with `.zettel/sim.sh`: 13 named vectors plus 3000 random summands over six runs against a behavioural round-to-nearest-even reference, `PASS`. The named vectors are the asymmetric ones — $16, 1, 1$ leaves the register at $16$ because each unit is exactly half an ulp at that exponent and ties-to-even rounds down, while the *same three summands* in the order $1, 1, 16$ give $18$ exactly. Non-associativity, in three cycles.

**Related Notes.**

- [[Two's-Complement Exact Accumulator]] – counter-example: replaces the FP adder in the loop with a wide fixed-point register, so nothing rounds and both failures vanish at once.
- [[Choosing an Accumulator]] – compares: the cost/accuracy table this note sits at the top of.
- [[Floating-Point Operators]] – depends-on: the adder whose latency $l$ is the loop-carried dependency.
- [[Exact Sum-of-Products Operator]] – extends: the right-hand panel above, done without rounding.
- [[Error Analysis]] – supports: the $(1+\delta)$ model the $(N-1)u$ bound is derived from.
- [[Rounding]] – supports: ties-to-even is why a half-ulp summand is discarded whole rather than half-counted.
- [[Adders]] – depends-on: the significand addition at the centre of the FP adder in the loop.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 21, "Floating-Point Accumulation and Sum of Products".

- Chapter intro and Fig. 21.1 — iterative accumulation, FP adder latency $l$ in the loop, interleaved sub-sums, adder tree for small constant $N$, error growth with $N$, wider significand: pp. 623–624
- Fig. 21.2 — keeping the accumulator in fixed point, the fix this note motivates: p. 625
- §21.3 Cost, speed, and accuracy — comparison against the exact accumulators: pp. 638–639
