---
title: "Radix-4 Maximally Redundant Divider"
description: "The gamma=3 SRT variant: full selection-interval overlap shrinks the table to 4+1 input bits, but the digit set now needs 3D, a fourth mux input that breaks the single-LUT-row packing."
kind: circuit
source: "ASA §9.2.4, pp. 277-279"
status: seed
spade: simulated
tags: [digital, dividers, srt, redundant, fpga]
aliases:
  - "Maximally Redundant Divider"
  - "Maximally Redundant SRT"
  - "Radix-4 SRT with gamma = 3"
  - "SRT radix-4 gamma=3"
---

# Radix-4 Maximally Redundant Divider

A radix-4 [[SRT Division|SRT]] digit recurrence run at the largest digit set the radix admits, $\{-3,\dots,3\}$, which pushes the redundancy factor to exactly $1$ and collapses the quotient-digit selection table to five input bits — at the price of a $3D$ multiple the multiplexer must carry.

```tikz title="One iteration of a radix-4 maximally redundant SRT divider: 5-input selection table, four-input multiple mux including 3D, add/sub"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- top-level inputs
  \draw (-3.6,5.2) -- (-3.6,1.0);
  \node[anchor=south] at (-3.6,5.22) {$R_i$};
  \node[anchor=west] at (-3.55,4.95) {$w_R = w_F{+}2$};
  \draw (2.4,5.2) -- (2.4,2.05);
  \node[anchor=south] at (2.4,5.22) {$D$};
  \node[anchor=west] at (2.45,4.95) {$w_F{+}1$};
  \draw (5.4,5.2) -- (5.4,1.4);
  \node[anchor=south] at (5.4,5.22) {$3D$};
  \node[anchor=west] at (5.45,4.95) {$w_F{+}3$};
  % ---------- taps into the selection table
  \draw (-3.6,4.7) -- (-6.0,4.7) -- (-6.0,3.9);
  \node[anchor=south] at (-4.8,4.72) {4 MSBs of $\beta R_i$};
  \draw (2.4,4.3) -- (-4.6,4.3) -- (-4.6,3.9);
  \node[anchor=south] at (-0.6,4.32) {1 bit of $D$};
  \draw (-6.9,3.0) rectangle (-3.9,3.9);
  \node at (-5.4,3.45) {\textsf{sel}: 5 in, 3 out};
  % ---------- the quotient digit bus
  \draw (-5.4,3.0) -- (-5.4,-0.25) -- (-5.0,-0.25);
  \draw (-5.4,2.4) -- (-1.9,2.4) -- (-1.9,1.15) -- (-0.72,1.15);
  \node[anchor=west] at (-3.35,2.62) {$q^{\oplus}_{-i}$, 2 bits};
  \node[anchor=east] at (-5.45,0.6) {$q^{\ominus}_{-i}$, sign};
  % ---------- shifted partial remainder
  \node[anchor=west] at (-3.55,3.45) {$\ll 2$};
  \node[anchor=west] at (-3.55,0.75) {$\beta R_i$, $w_R{+}2$};
  % ---------- multiplexer
  \draw (-0.9,1.4) -- (6.2,1.4) -- (5.8,0.85) -- (-0.5,0.85) -- cycle;
  \node[anchor=north,font=\footnotesize] at (-0.5,1.38) {$0$};
  \node[anchor=north,font=\footnotesize] at (1.2,1.38) {$1$};
  \node[anchor=north,font=\footnotesize] at (3.0,1.38) {$2$};
  \node[anchor=north,font=\footnotesize] at (5.4,1.38) {$3$};
  \node at (4.2,1.08) {\textsf{mux}};
  \draw (-0.5,1.75) -- (-0.5,1.4);
  \node[anchor=south] at (-0.5,1.77) {$0\ldots 0$};
  \draw (1.2,2.05) -- (3.0,2.05);
  \draw (1.2,2.05) -- (1.2,1.4);
  \draw (3.0,2.05) -- (3.0,1.4);
  \node[anchor=east] at (1.15,1.68) {$D$};
  \node[anchor=west] at (3.05,1.68) {$D{\ll}1$};
  % ---------- add / subtract
  \draw (2.6,0.85) -- (2.6,0.2);
  \node[anchor=west] at (2.65,0.52) {$q^{\oplus}_{-i}D$, $w_R{+}2$};
  \draw (-5.0,-0.7) rectangle (5.0,0.2);
  \node at (0.5,-0.25) {\textsf{add/sub}};
  \node[anchor=east] at (-5.45,-0.25) {$\pm$};
  \draw (-3.6,1.0) -- (-3.6,0.2);
  % ---------- output
  \draw (0.5,-0.7) -- (0.5,-1.5);
  \node[anchor=north] at (0.5,-1.52) {$R_{i+1} = \beta R_i - q_{-i}D$, \ $w_R$};
  \node[anchor=north,align=center] at (0.5,-2.25)
    {digit set $\{-3,\dots,3\}$, so the mux has a \emph{fourth} input and
     mux ${+}$ add/sub no longer fit one row of 6-LUTs\\
     the top 3 bits of the $(w_R{+}3)$-bit sum are all the sign bit: two are never
     computed, and $R_{i+1}$ is as wide as $R_i$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.10, p. 279, with the selection widths of Fig. 9.9, p. 278.*

**Take the digit set as large as the radix allows and the redundancy factor saturates.** The [[SRT Division|digit recurrence]] $R_{i+1} = \beta R_i - q_{-i}D$ with digit set $\mathcal{D} = \{-\gamma,\dots,\gamma\}$ preserves the invariant $|R_i| \le \rho D$ for the redundancy factor $\rho = \gamma/(\beta-1)$ (9.29). At $\beta = 4$ the useful choices are $\gamma = 2$ and $\gamma = 3$; $\gamma = 3$ is the largest digit still expressible without a multiplier, and it gives

$$\rho = \frac{3}{4-1} = 1$$

the maximum, hence *maximally redundant*. Every extra unit of $\gamma$ beyond this would need a $4D$ multiple, which is $D \ll 2$ — free in hardware, but $\gamma = 4$ makes $\mathcal{D}$ larger than the radix needs and buys no further overlap, since $\rho > 1$ violates nothing but stores a remainder that no longer fits alongside $D$ in the same width.

**With $\rho = 1$ the selection intervals overlap by a full unit, and the overlap *is* the error budget.** Digit $k$ is legal exactly when $\beta R_i/D \in S_k = [k-\rho,\, k+\rho]$, so consecutive intervals overlap by $2\rho - 1$, and an approximation $\hat y$ of $y = \beta R_i/D$ with $|y - \hat y| \le \varepsilon$ can be compared against fixed thresholds provided $\varepsilon < 2\rho - 1$ (see [[Quotient Digit Selection Table]] for the general argument). At $\gamma = 2$ that budget is $2\cdot\tfrac23 - 1 = \tfrac13$; at $\gamma = 3$ it is

$$\varepsilon < 2\cdot 1 - 1 = 1$$

a whole unit of $\beta R_i$. So you may throw away *everything below the binary point* of $\beta R_i$ and still select correctly. That is the entire saving, and it is why the table shrinks from the $6+3 = 9$ inputs of the $\gamma = 2$ variant (Fig. 9.7, p. 276) to $4+1 = 5$ (Fig. 9.9, p. 278) — small enough to match one FPGA LUT (p. 277).

**Four bits of $\beta R_i$ is not a choice, it is what the invariant leaves.** Normalised significands give $D \in [1,2)$ and the invariant gives $|R_i| \le \rho D = D < 2$, so $|\beta R_i| = |4R_i| < 8$: the integer part of $\beta R_i$ is a 4-bit two's-complement number $t = \lfloor \beta R_i \rfloor \in [-8,7]$, and by the previous paragraph nothing below it is needed. The one bit of $D$ is the bit of weight $\tfrac12$, i.e. the test $D \ge \tfrac32$. Solving $(q-1)D \le \beta R_i \le (q+1)D$ over $\beta R_i \in [t,t+1)$ and $D$ in each half-range yields the table

| $t = \lfloor\beta R_i\rfloor$ | $-8\ldots-5$ | $-4$ | $-3$ | $-2,-1$ | $0$ | $1$ | $2$ | $3$ | $4\ldots7$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $D < 3/2$ | $-3$ | $-3$ | $-2$ | $-1$ | $0$ | $1$ | $2$ | $3$ | $3$ |
| $D \ge 3/2$ | $-3$ | $-2$ | $-2$ | $-1$ | $0$ | $1$ | $2$ | $2$ | $3$ |

(derived here from (9.30), not copied from the book, and checked in simulation below; the book prints the P-D plot rather than the table). Two observations pay for the derivation. First, the two rows differ in **exactly two of sixteen columns**, $t = -4$ and $t = +3$ — the $D$ bit is a repair for two boundary cells, not a genuine second dimension, which is the concrete sense in which the selection function has "almost" stopped depending on $D$. Second, the table is *not* symmetric under $t \mapsto -t$, because $\lfloor\cdot\rfloor$ is a one-sided approximation: $t \le \beta R_i < t+1$ biases every row upward, exactly the asymmetry that (9.44)–(9.45) formalise for a truncated [[Carry-Save Partial Remainder|carry-save remainder]].

**The bill arrives at the multiplexer, and it is $3D$.** The digit set now needs $q_{-i}D \in \{0, \pm D, \pm 2D, \pm 3D\}$. The first three are wiring — $2D = D \ll 1$ — but $3D = D + (D \ll 1)$ is a real addition of width $w_F+2$. It is loop-invariant, so it is computed once before the loop and never again (p. 277). In a fully unrolled (spatial) implementation that leaves a genuine choice: **(a)** carry only $D$ from stage to stage and recompute $3D$ locally in each, which puts an adder on the critical path of every iteration; or **(b)** carry both $D$ and $3D$, which is the option drawn above and trades a row of registers per stage against a row of LUTs. Area-wise it is close to a wash; delay-wise (b) wins, so (b) is what gets built.

**The fourth mux input is what actually costs you on an FPGA, and it costs a whole LUT row.** Encode the digit in two's complement on three bits, $q_{-i} = -4q^{\ominus}_{-i} + q^{\oplus}_{-i}$ (9.32), with $q^{\ominus}$ the sign steering the add/sub and $q^{\oplus}$ the two-bit magnitude steering the mux. At $\gamma = 2$ each bit position of "select a multiple, then add or subtract it" is a function of **six** inputs — one bit of $R_i$, one of $D$, one of $2D$, and the three bits of $q_{-i}$ — so the whole multiplexer and adder/subtracter merge into a single row of 6-input LUTs riding the fast carry chain (p. 276). At $\gamma = 3$ the same function additionally reads one bit of $3D$: **seven** inputs, which no 6-LUT holds. Shannon-decomposing on the seventh variable needs two 6-LUTs and a mux per bit position, so the merged row roughly doubles — the book states the consequence ("prevents packing the multiplexer and the adder/subtracter in a single row of LUTs", p. 277) without costing it. That is the trade in one sentence: **the $\gamma = 3$ table is smaller by four input bits, and the datapath is larger by a LUT row of width $w_R$.** On a 6-LUT device the datapath wins and $\gamma = 2$ is the FPGA design point; on an ASIC, where a 4:1 mux is not quantised to a magic input count, the smaller and faster selection table is a real advantage.

> [!warning] No LUT counts or delays for either variant in the source
> Chapter 9 is architectural throughout: it gives selection-function input widths, iteration counts and error budgets, but never a synthesis result. "Roughly doubles" above is a structural inference from a 7-input function on a 6-LUT device, not a measured figure, and it assumes a Xilinx-style slice with an F7 mux. Sizing $\gamma = 2$ against $\gamma = 3$ on a real part needs a [[FloPoCo]] run (`srt=42` versus `srt=43`) and outside data.

**Every wire keeps its width because the invariant kills the growth.** With $D$ on $w_F+1$ bits (leading $1$ plus $w_F$ fraction bits, scale $2^{-w_F}$) and $R_i$ on $w_R = w_F+2$ bits two's complement (sign, one integer bit, $w_F$ fraction bits, enough for $|R_i| \le D < 2$), the shift $\beta R_i = R_i \ll 2$ takes $w_R+2$ bits and $3D$ takes $w_F+3$. The subtraction of two $(w_R+2)$-bit values is $w_R+3$ bits — but its result satisfies $|R_{i+1}| \le \rho D = D$ *by construction*, so the three leading bits of the sum are all copies of the sign. Two of them are simply not computed, and $R_{i+1}$ re-enters the loop at $w_R$ bits (Fig. 9.10 caption, p. 279). The recurrence is therefore width-stable: iterating it $k$ times costs $k$ times one adder of fixed width, unlike the [[Newton-Raphson Reciprocal|Newton-Raphson]] family whose datapath doubles per step. Ground the significand format in [[Number Formats]]; the exactness argument is in [[Error Accuracy]].

> [!note] $\rho = 1$ also buys a cheaper start.
> Convergence requires $|R_1| \le \rho D$ from the first iteration. With $X, D \in [1,2)$ and $\rho = 1$ the initialisation $R_1 = X/2 < 1 \le D$ works directly; every $\rho < 1$ — including $\gamma = 2$, where $\rho = 2/3$ — needs $R_1 = X/4$ instead, with the quotient scaled back by the same factor and its first digit produced by a special-cased selection function (p. 279). Maximal redundancy is the only radix-4 digit set that starts the loop without a wasted scaling.

**Termination is a comparison against an exact identity, not an error estimate.** Unrolling gives $R_1/D = Q_i + \beta^{-i}R_{i+1}/D$ (9.34), an *exact* equation — no rounding has happened anywhere — and the invariant $|R_{i+1}/D| \le \rho$ turns it into $|R_1/D - Q_i| \le \rho\beta^{-i} = 4^{-i}$ at $\rho = 1$ (9.35). Correct rounding is then a decision taken on the final remainder rather than an approximation (p. 280). Needing $w_F+3$ significand bits gives

$$k = \left\lceil \frac{w_F+3}{2} \right\rceil$$

iterations at radix 4 — $13$ for binary32, $28$ for binary64. The digits arrive signed, so a final $w_Q$-bit carry-propagate subtraction (9.36–9.37) or [[On-the-Fly Quotient Conversion|on-the-fly conversion]] is still owed.

$$\boxed{\ \rho = \frac{\gamma}{\beta-1} = 1 \ \Longrightarrow\ \varepsilon < 1 \ \Longrightarrow\ \text{sel}: 4\ \text{bits of } \beta R_i + 1\ \text{bit of } D \to 3\ \text{bits of } q_{-i}, \quad k = \lceil (w_F+3)/2\rceil\ }$$

**When it breaks.**

- **$D$ not normalised.** The selection wedges have vertical extent $(2\rho-1)D = D$, so they narrow to nothing as $D \to 0$ and the fixed table is meaningless. Integer operands must be normalised first (a leading-zero count and two shifters), or the digit chosen by [[Comparison-Based Digit Selection|comparison against precomputed multiples]] instead (p. 282).
- **A carry-save partial remainder.** Truncating a redundant $\beta R_i$ at position $t$ hides a carry of weight $2^t$, which eats $2^t/D$ out of the overlap (9.44–9.45). $\rho = 1$ has the largest budget of any radix-4 digit set to absorb it, but the selection input still grows, and the $4+1$ bit count above does not survive.
- **6-LUT FPGAs.** The whole point of the smaller table is lost against a doubled datapath row; $\gamma = 2$ is the better mapping and the reason `flopoco FPDiv wE=8 wF=23 srt=42` is the default rather than `srt=43` (pp. 276–277, [[FloPoCo]]).
- **A divisor that changes every cycle.** $3D$ is only free because it is loop-invariant. Streaming a new $D$ per iteration puts its adder on the critical path, and option (a) above becomes mandatory.
- **Pushing the radix instead of the digit set.** The maximally redundant radix-8 variant ($\beta = 8$, $\gamma = 7$) exists in FloPoCo and is both larger and slower than either radix-4 divider (p. 277). Higher radices pay only after [[Divisor Prescaling|prescaling]] removes the $D$ dependence entirely.
- **Don't-cares.** Four of the sixteen $t$ values are unreachable in each $D$ half-range. FloPoCo cannot express don't-cares, so out-of-domain cells are all assigned an extreme digit (p. 276) — harmless for correctness, but it costs table logic a hand-built [[Lookup-Tables|LUT]] would not spend.

**RTL (Spade).**

```spade
/// Quotient-digit selection for radix 4, gamma = 3 (rho = 1).
/// t = floor(4 R / 2^23), the 4-bit integer part of beta*R_i.
/// dhi = the one bit of D below its implicit leading 1, i.e. D >= 3/2.
fn sel(t: int<4>, dhi: bool) -> int<3> {
    match t {
        -4 => if dhi { -2 } else { -3 },
         3 => if dhi {  2 } else {  3 },
        -8 => -3, -7 => -3, -6 => -3, -5 => -3,
        -3 => -2,
        -2 => -1, -1 => -1,
         0 =>  0,
         1 =>  1,
         2 =>  2,
         _ =>  3,
    }
}

/// One iteration of the radix-4 maximally redundant SRT recurrence, w_F = 23.
/// D:  normalised significand, 24 bits, MSB set, scale 2^-23, so D in [1,2).
/// R:  same scale, 25 bits two's complement, invariant |R| <= D.
/// D3: 3D on 26 bits, precomputed once outside the loop.
entity srt4mr_step(r: int<25>, d: uint<24>, d3: uint<26>) -> int<25> {
    let br: int<27> = sext(r) << 2;
    let q = sel(br.as_bits()[23..27].as_int(), d.as_bits()[22]);

    let dz: uint<26> = zext(d);
    let mag: uint<26> = match q {
        -3 => d3,    3 => d3,
        -2 => dz << 1,  2 => dz << 1,
        -1 => dz,    1 => dz,
         _ => 0,
    };
    let m: int<27> = zext::<26, 27>(mag).as_int();
    let sum: int<28> = if q < 0 { br + m } else { br - m };
    trunc(sum)
}
```

`sel` is the diagram's 5-in/3-out table: `br.as_bits()[23..27]` is the 4-MSB tap (bit 23 carries weight $2^0$ after the shift, so the slice *is* $\lfloor\beta R_i\rfloor$) and `d.as_bits()[22]` is the single $D$ bit. `mag` is the four-input mux — `d3` is a port, not an expression, because $3D$ lives outside the loop — and the sign test `q < 0` is the add/sub's $\pm$. The width chain is the one drawn: $25 \to 27$ on the shift, $27 \to 28$ because Spade's `-` grows by one, then `trunc` back to $25$, discarding three bits that the invariant guarantees are all the sign. Everything here is combinational; the loop is one `reg(clk)` of $w_R = 25$ bits around this entity, plus a 4-bit down-counter for the $k = 13$ iterations, plus registers holding the loop-invariant `d` and `d3` — and separately the two muxes and two quotient-width registers that [[On-the-Fly Quotient Conversion|on-the-fly conversion]] costs per iteration (p. 282). Synthesis will not keep the mux and the adder apart the way the drawing does; it will fuse them into LUT logic feeding the carry chain, which is precisely where the seventh input bites.

Simulated with `.zettel/sim.sh`: 12 named vectors including the asymmetric $R = 1,\ D = \texttt{0xFFFFFF}$ (smallest remainder against the largest divisor) and both invariant boundaries $R = \pm D$, plus a 6000-vector random sweep over normalised $D$ and $|R| \le D$. Each vector is checked three ways against a behavioural reference — $\beta R_i - R_{i+1}$ is an exact multiple of $D$, the implied digit lies in $\{-3,\dots,3\}$, and $|R_{i+1}| \le D$. 6012 passed, 0 failed; the invariant check is also what confirms the two dropped sign bits never carried information.

**Related notes.**

- [[SRT Division]] – extends: the general digit recurrence with a redundant digit set; this note fixes $\beta = 4$, $\gamma = 3$.
- [[Redundant Number Systems]] – depends-on: $\mathcal{D} = \{-3,\dots,3\}$ at radix 4 is maximally redundant precisely in that system's sense.
- [[Quotient Digit Selection Table]] – depends-on: the P-D diagram and the $\varepsilon < 2\rho-1$ budget that sizes the table derived above.
- [[Lookup-Tables]] – supports: the 5-input, 3-output table is one LUT per output bit, which is the whole claim of this variant.
- [[Carry-Save Partial Remainder]] – extends: removes the carry propagation from the loop, and spends part of the $\rho = 1$ overlap doing it.
- [[On-the-Fly Quotient Conversion]] – supports: converts the signed digits this circuit emits without a final carry propagation.
- [[Divisor Prescaling]] – compares: an alternative way to shrink the selection function, by removing its $D$ dependence rather than widening the overlap.
- [[Comparison-Based Digit Selection]] – counter-example: selects the digit without a table at all, which is what you must do when $D$ cannot be normalised.
- [[Non-Restoring Division]] – compares: the $\beta = 2$, $\gamma = 1$ ancestor, where $\rho = 1$ also holds but the digit set has no $\pm 3$ to pay for.
- [[Shift-and-Add]] – depends-on: $2D$ and $3D = D + (D\ll1)$ are the only multiples needed, which is why no multiplier appears.
- [[FloPoCo]] – supports: `flopoco FPDiv wE=8 wF=23 srt=43` generates exactly this architecture, unrolled in space.
- [[Choosing a Divider]] – compares: where this sits against the restoring, multiplicative and speculative families.
- [[Radix-64 Speculative Divider]] – extends: three radix-4 steps per cycle with prescaling and speculation, the latency-optimised end of the same family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 9 "Fixed-Point Division":

- §9.2.4, pp. 272–275 — redundant digit sets, (9.27)–(9.30): $\rho = \gamma/(\beta-1)$, the selection intervals $S_k$ and their overlap $2\rho-1$.
- §9.2.4, p. 276 — the $\gamma = 2$ comparison point: Fig. 9.7 (6+3 selection bits), the two's-complement digit encoding (9.32), the single 6-LUT row, and the FloPoCo `srt=42` box including the don't-care limitation.
- §9.2.4, pp. 277–279 — **Example 2: $\beta = 4$, $\gamma = 3$**; **Fig. 9.9, p. 278** (P-D plot, 4 bits of $\beta R_i$ and 1 bit of $D$); **Fig. 9.10, p. 279** (the architecture redrawn above, and the sign-replica width argument in its caption); the $3D$ pre-computation trade-off and the radix-8 $\gamma = 7$ remark.
- §9.2.5, p. 279 — initialisation $R_1 = X/2$ for maximally redundant systems versus $R_1 = X/4$ otherwise.
- §9.2.5, p. 280 — termination, (9.33)–(9.35), and why correct rounding is a decision rather than an approximation.
- §9.2.6, pp. 281–282 — (9.36)–(9.43), final subtraction versus on-the-fly conversion and its per-iteration cost.
- §9.2.7, p. 282 — why the P-D tiling fails for $D$ near zero.
- §9.2.9, pp. 286–287 — (9.44)–(9.45), the one-sided truncation error a carry-save remainder introduces into the overlap budget.
