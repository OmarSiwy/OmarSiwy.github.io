---
title: Pipelined Compressor Tree
description: "Registers between compression stages turn the free (1;1) pseudo GPC into a flip-flop priced at 0.5 LUT6, which flips the objective toward compressing early — and is why Reduced Area beats Dadda the moment the tree is pipelined."
kind: circuit
source: "ASA §7.3.3.4 and §7.4, pp. 179-180, 192-197"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, pipelining, fpga]
aliases:
  - Pipelined Compressor Trees
  - Fully Pipelined Compressor Tree
---

# Pipelined Compressor Tree

A compressor tree with a register bank at one or more stage boundaries, which is
the one change that gives the pass-through $(1;1)$ pseudo GPC a nonzero cost and
therefore makes *when* a dot is compressed an area question rather than a
tie-break.

```tikz title="Compressor tree with register banks between stages, and the (1;1) pseudo GPC priced as a flip-flop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % ---- heap A : 8 columns, height 6 ----
  \foreach \r in {0,...,5}{\foreach \c in {0,...,7}{
      \fill (\c*0.36, 6.75+\r*0.24) circle (1.5pt);}}
  \node[anchor=west] at (3.2,7.35) {8 columns, height 6};
  \node[anchor=west] at (3.2,7.05) {48 dots, weights $2^0\ldots2^7$};

  \draw[->,>=latex] (1.26,6.6) -- (1.26,6.3);
  \draw[fill=gray!8] (-0.15,5.7) rectangle (2.67,6.3);
  \node at (1.26,6.0) {compression stage 0};

  \draw[->,>=latex] (1.26,5.7) -- (1.26,5.42);
  \draw[fill=gray!25,dashed] (-0.15,5.0) rectangle (2.67,5.42);
  \node at (1.26,5.21) {pipeline register};
  \node[anchor=west] at (3.2,5.21) {1 FF per surviving dot};

  \draw[->,>=latex] (1.26,5.0) -- (1.26,4.72);
  \foreach \r in {0,1,2}{\foreach \c in {0,...,9}{
      \fill (\c*0.36, 4.05+\r*0.24) circle (1.5pt);}}
  \node[anchor=west] at (3.9,4.29) {10 columns, height 3};

  \draw[->,>=latex] (1.26,3.9) -- (1.26,3.6);
  \draw[fill=gray!8] (-0.15,3.0) rectangle (2.67,3.6);
  \node at (1.26,3.3) {compression stage 1};

  \draw[->,>=latex] (1.26,3.0) -- (1.26,2.72);
  \draw[fill=gray!25,dashed] (-0.15,2.3) rectangle (2.67,2.72);
  \node at (1.26,2.51) {pipeline register};

  \draw[->,>=latex] (1.26,2.3) -- (1.26,2.02);
  \foreach \r in {0,1}{\foreach \c in {0,...,10}{
      \fill (\c*0.36, 1.6+\r*0.24) circle (1.5pt);}}
  \node[anchor=west] at (4.1,1.72) {11 columns, height 2};

  \draw[->,>=latex] (1.26,1.45) -- (1.26,1.2);
  \draw[fill=gray!8] (-0.15,0.6) rectangle (2.67,1.2);
  \node at (1.26,0.9) {final adder, 11 bits};
  \draw[->,>=latex] (1.26,0.6) -- (1.26,0.3);
  \node[anchor=west] at (3.2,0.45) {sum, 11 bits};
  \foreach \c in {0,...,10}{\fill (\c*0.36, 0.15) circle (1.5pt);}

  % ---- inset : the (1;1) pseudo GPC ----
  \draw[dotted] (6.6,2.55) rectangle (11.3,4.6);
  \node[anchor=west] at (6.8,4.3) {$(1;1)$ pseudo GPC};
  \fill (7.1,3.65) circle (1.5pt);
  \draw[->,>=latex] (7.2,3.65) -- (7.9,3.65);
  \draw (7.9,3.35) rectangle (8.6,3.95);
  \node at (8.25,3.65) {FF};
  \draw[->,>=latex] (8.6,3.65) -- (9.3,3.65);
  \fill (9.4,3.65) circle (1.5pt);
  \node[anchor=west] at (6.8,3.05) {combinational: a wire, $k=0$};
  \node[anchor=west] at (6.8,2.78) {registered: one FF, $k=0.5$ LUT6};
\end{circuitikz}
\end{document}
```

**Pipeline because the stages are already there.** A compressor tree is fast but
not arbitrarily fast: it is $S$ stages deep, with $S\in\{2,\dots,6\}$ for heaps up
to 16 384 bits (Fig. 7.29b, p. 197), and each stage costs one LUT delay plus the
generic routing between stages, which on FPGA dominates. The tree's own structure
already partitions the logic into levels of equal depth, so cutting it at level
boundaries needs no retiming argument — *fully pipelined* means a register after
every compressor, one heap accepted per cycle, latency $S$ cycles.

**Registering a boundary gives the wire a price.** The synthesis cost model of
[[Efficiency-Driven Compression Heuristic]] scores each compressor $e$ by
$E=\delta/k$, with $\delta=b_i-b_o$ the dots removed and $k$ its LUT6 count, and
carries one degenerate entry: the $(1;1)$ *pseudo GPC* — one dot in, the same dot
out, $\delta=0$, $k=0$. It exists so that every dot always has a legal move into
the next stage and the covering problem is never infeasible. Combinationally it
is a wire and costs nothing. Put a register bank at that boundary and the wire
becomes a flip-flop, and since an AMD slice carries two flip-flops per LUT6, one
FF is charged half a LUT6 (p. 194):

$$c_{(1;1)}=0\ \text{(combinational stage)},\qquad c_{(1;1)}=\tfrac12\ \text{LUT6 (registered stage)} .$$

**Deferring a dot now costs area, linearly in stages deferred.** A dot produced
in stage $s$ and not consumed until stage $s+\Delta s$ is carried by $\Delta s$
successive $(1;1)$ instances, so it costs $\tfrac12\Delta s$ LUT6 whether or not
it is ever compressed at all. Summed over the heap, the objective acquires a term
proportional to the number of *dot-stage crossings* rather than to the number of
compressors, so minimising cell count and minimising area stop being the same
problem. The greedy heuristic needs no modification to respond: it orders the
library by $E$ and the $(1;1)$ sits at the bottom of that order, so it is always
the last choice, which is exactly compress-as-soon-as-possible (p. 193). The ILP
absorbs it more cleanly still — the FF term is one more contribution to $c_e$ on
the stages that are cut, and the solve is global rather than stage-local.

**This is why Reduced Area beats Dadda under pipelining.** [[Dadda Tree]] is
as-late-as-possible by construction: it never compresses a column below the
height the next level can still absorb, so the number of live dots at every stage
boundary is as large as the schedule permits, and each of them becomes a
flip-flop. [[Reduced Area Compressor Tree]] applies the maximum number of full
adders per column at each level, spending more FA and HA cells for the same stage
count $L$ from $m_l=\lfloor 1.5\,m_{l-1}\rfloor$, but leaving fewer dots alive to
be registered — and as a side effect a 10-bit final adder against Dadda's 14 on
the $8\times8$ example of Figs. 7.19–7.20. On a combinational tree Dadda wins on
cell count; insert the registers and the comparison inverts (pp. 179–180).

> [!warning] Table 7.2, p. 180, is unusable as printed
> The table that is supposed to quantify this comparison reads FA $=0$, HA $=0$,
> FF $=-80$ for *both* Dadda and RA. Those FF entries cannot both be right: the
> prose one paragraph earlier states that the RA tree "requires the smaller final
> adder and a significant lower amount of FFs when pipelined", and the table's own
> caption assumes the extreme case of a pipeline stage after every full adder.
> Only the final-adder lengths, 14 and 10, survive. The *direction* of the FF
> claim is sound; the magnitude is not available from this source.

**FPGA and ASIC charge the registers to different accounts.** On ASIC every
compressor sitting in a pipelined stage acquires an additional FF cost, so each
$c_e$ has to be adjusted stage by stage and the bias toward early compression
applies across the whole library. On FPGA it does not: the basic logic element
already contains an optional output flip-flop behind its LUT, and enabling it
normally costs nothing, so registering the output of a GPC that is already
burning the LUT is free. What is not free is the $(1;1)$ — it occupies a
flip-flop with no LUT beneath it, which is precisely what the half-LUT6 charge
accounts for. The same routing delay that makes the FF cheap also means FPGAs
typically need *more* pipeline stages than ASICs to hit a given period (p. 193).
See [[Lookup-Tables]] for the BLE structure the argument rests on.

**Pipelining erases the arrival profile.** A combinational multiplier heap is
triangular, so its least- and most-significant columns settle first and the
middle last — the Gaussian-like profile that motivates [[Split Final Adder]].
Register the boundary and every input to the following stage arrives at the clock
edge, so the profile is gone and the split loses its justification (p. 194); use
a plain carry-chain adder instead. Truncation flattens the same profile for a
different reason.

**The published numbers are pipelined numbers.** The experiments of §7.4 were run
on *fully pipelined* trees, a register after every GPC, which is why the $(1;1)$
was priced at 0.5 LUT6 there in the first place. Under that setting the
efficiency heuristic costs a near-linear **0.55 LUT6 per compressed bit** out to
16 384 bits (Fig. 7.29a, p. 197) — an improvement on the 0.65 of [KK18] that came
from better compressors, not a better schedule. The ILP is visibly but not
dramatically cheaper below about 1024 bits and often reaches the same heap in one
stage fewer (Fig. 7.28, p. 196), though many of its points hit the one-hour
Gurobi timeout. One stage fewer is one whole heap of flip-flops removed, so an
optimal solve is worth more on a pipelined tree than on a combinational one.

$$\boxed{\ C=\sum_{s,c,e}c_e\,k_{s,e,c},\qquad
c_{(1;1)}=\begin{cases}0 & \text{stage } s \text{ combinational}\\[2pt]
\tfrac12\ \text{LUT6} & \text{stage } s \text{ registered}\end{cases}\ }$$

**When it breaks.** Partial pipelining — a register every two or three stages —
restores $c_{(1;1)}=0$ *inside* each group, so the schedule reverts toward Dadda
locally and only the cut boundaries reward early compression; the model has to be
told which boundaries are cut, not merely that the operator is pipelined. The
0.5 LUT6 figure is an AMD-slice ratio and means nothing on ASIC, where FF area is
the unit and every registered compressor pays as well, making the ASAP bias
stronger still. A heap of height $\le 3$ compresses in a single stage, so there is
no interior boundary and nothing to schedule. If the design is latency-bound
rather than throughput-bound the whole exercise is a loss: it buys $S$ cycles of
latency and a large flip-flop count for a clock the surrounding logic may not
need. And the cost model assumes the register bank stays where it was drawn — a
synthesis tool with retiming enabled will move it, at which point the schedule
was optimised against a boundary that no longer exists.

**RTL.** Three stages for six 8-bit rows, built from $(3;2)$ row compressions,
with one row deliberately deferred so the $(1;1)$ path is visible in the source
instead of only in a cost table.

```spade
fn csa_sum(a: uint<11>, b: uint<11>, c: uint<11>) -> uint<11> {
    a ^ b ^ c
}

fn csa_carry(a: uint<11>, b: uint<11>, c: uint<11>) -> uint<11> {
    ((a & b) | (a & c) | (b & c)) <<. 1
}

pipeline(2) ct6(
    clk: clock,
    a: uint<8>, b: uint<8>, c: uint<8>,
    d: uint<8>, e: uint<8>, f: uint<8>,
) -> uint<11> {
        // stage 0: heap height 6 -> 4 rows, two (3;2) row compressions
        let r0: uint<11> = zext(a);
        let r1: uint<11> = zext(b);
        let r2: uint<11> = zext(c);
        let r3: uint<11> = zext(d);
        let r4: uint<11> = zext(e);
        let r5: uint<11> = zext(f);
        let p0 = csa_sum(r0, r1, r2);
        let p1 = csa_carry(r0, r1, r2);
        let p2 = csa_sum(r3, r4, r5);
        let p3 = csa_carry(r3, r4, r5);
    reg;
        // stage 1: 4 -> 3 rows.  p3 is left alone: a (1;1) pseudo GPC.
        let q0 = csa_sum(p0, p1, p2);
        let q1 = csa_carry(p0, p1, p2);
    reg;
        // stage 2: 3 -> 2 rows, then the final adder
        let t0 = csa_sum(q0, q1, p3);
        let t1 = csa_carry(q0, q1, p3);
        t0 +. t1
}
```

`r0..r5` are the six rows of the top heap in the diagram, zero-extended to 11 bits
because the exact sum of six 8-bit values is at most $6\cdot255=1530<2^{11}$;
`csa_carry` uses the truncating `<<.` so every row stays 11 bits, and no row can
carry out of bit 10 without two rows each exceeding 1024 and the total exceeding
1530. Each `reg;` is one of the dashed register banks. `p3` is the pass-through:
produced in stage 0, consumed in stage 2, so Spade pipelines it across *both*
banks — 22 flip-flops, i.e. 11 LUT6-equivalents at $\tfrac12$ each, spent on a row
that is never compressed, which is the whole cost argument above in one
identifier. Synthesis will not build the drawn register banks as separate rows of
cells: those flip-flops are the output FFs of the LUTs computing the stage above
them, and `t0 +. t1` becomes a carry-chain adder rather than the block the diagram
shows.

Simulated: 3007 vectors, 7 named — including the asymmetric $1+128$ and $3+192$,
which any weight or shift-direction error fails — plus 3000 random, against a
behavioural `a+b+c+d+e+f`.

**Related Notes**

- [[Reduced Area Compressor Tree]] – supports: the ASAP schedule this cost model
  rewards, and the reason it is the default once a tree is registered.
- [[Dadda Tree]] – counter-example: ALAP minimises cells and maximises exactly
  the quantity — live dots per boundary — that pipelining charges for.
- [[Efficiency-Driven Compression Heuristic]] – depends-on: supplies the $E$
  ordering that already places the $(1;1)$ last, so it needs no change to become
  pipeline-aware.
- [[Generalized Parallel Counter]] – depends-on: the compressor whose per-type
  cost $c_e$ picks up the extra FF term on ASIC and does not on FPGA.
- [[Lookup-Tables]] – depends-on: the BLE's optional output flip-flop is why
  registering a GPC output is free and registering a bare dot is not.
- [[Split Final Adder]] – counter-example: the arrival-profile optimisation that
  pipelining makes pointless.
- [[Choosing a Compressor Tree]] – compares: where a pipelined tree sits against
  the combinational alternatives.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §7.3.3.4 "Pipelined
  Compressor Trees", p. 193 — the pseudo $(1;1)$ GPC as an FF, ASIC vs FPGA FF
  cost, heuristic ordering.
- §7.3.1.2 and Table 7.2, pp. 177–180 — RA vs Dadda: final-adder length and FF
  count when pipelined (table misprinted, see the warning above).
- §7.3.3.1, Listing 7.2, p. 188 — the efficiency-ordered heuristic and the pseudo
  GPC's role in guaranteeing feasibility.
- §7.3.4, p. 194 — the arrival profile, and its irrelevance under pipelining.
- §7.4 with Figs. 7.28–7.29, pp. 194–197 — fully pipelined benchmark setting,
  0.5 LUT6 per FF, 0.55 LUT6 per compressed bit, stage counts 2–6.
