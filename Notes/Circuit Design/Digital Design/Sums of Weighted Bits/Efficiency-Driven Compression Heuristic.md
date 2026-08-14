---
title: "Efficiency-Driven Compression Heuristic"
description: "Orders a library by E=δ/k and greedily places the best effective-efficiency compressor per column per stage, with a pseudo (1;1) GPC guaranteeing progress; runs in seconds on 16 384-bit heaps at a linear 0.55 LUT6 per compressed bit, usually one stage worse than optimal."
kind: circuit
source: "ASA §7.3.3.1 and §7.4, pp. 186-197"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, compressor-tree, fpga, heuristic]
aliases:
  - heuristicMaxEff
  - Universal Compression Heuristic
  - Maximum-Efficiency Heuristic
  - Bit Heap Compression Heuristic
---

# Efficiency-Driven Compression Heuristic

A greedy scheduler that covers a bit heap stage by stage with whatever compressor currently maximises *effective* efficiency $\delta/k$ in the tallest remaining column, which is what makes arbitrary-shaped GPCs usable at all — Dadda and Wallace can only place a fixed FA/HA pair.

```tikz title="The two benchmark heap shapes: a rectangular multi-input adder and a triangular multiplier heap, both 100 dots at w=10"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=1]
% (a) IntMultiAdder: w inputs of w bits -> rectangular heap, w^2 dots
\begin{scope}[xshift=0cm]
  \foreach \c in {0,...,9}{
    \foreach \r in {1,...,10}{
      \fill (0.24*\c, 0.24*\r) circle (1.7pt);
    }
  }
  \draw[<->] (-0.30,0.10) -- (2.46,0.10);
  \node[anchor=north] at (1.08,0.06) {\footnotesize $w=10$ columns};
  \draw[<->] (2.62,0.14) -- (2.62,2.58);
  \node[anchor=west] at (2.68,1.36) {\footnotesize height 10};
  \node[anchor=north] at (1.08,-0.44) {(a) \texttt{IntMultiAdder}: $100$ dots};
\end{scope}
% (b) IntMultiplier 10x10 -> triangular heap, same 100 dots, 19 columns
\begin{scope}[xshift=5.2cm]
  \foreach \c in {0,...,18}{
    \pgfmathtruncatemacro{\h}{min(\c+1,min(19-\c,10))}
    \foreach \r in {1,...,\h}{
      \fill (0.24*\c, 0.24*\r) circle (1.7pt);
    }
  }
  \draw[<->] (-0.30,0.10) -- (4.62,0.10);
  \node[anchor=north] at (2.16,0.06) {\footnotesize $2w-1 = 19$ columns};
  \draw[<->] (4.78,0.14) -- (4.78,2.58);
  \node[anchor=west] at (4.84,1.36) {\footnotesize peak 10};
  \node[anchor=north] at (2.16,-0.44) {(b) \texttt{IntMultiplier}: $100$ dots};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 7.27, p. 195*

**Collapse compressor quality to one scalar so a greedy rule has something to sort by.** A compressor consuming $b_i$ dots and producing $b_o$ dots at a cost of $k$ LUT6 has two competing figures of merit (p. 183):

$$
E=\frac{b_i-b_o}{k}=\frac{\delta}{k}\ \text{(efficiency)},\qquad
\gamma=\frac{b_i}{b_o}\ \text{(compression ratio)} .
$$

$\gamma$ is the natural objective if you only care about stage count — it is the per-stage height shrink factor, and iterating it is exactly the $\Theta(\log_{\gamma}h)$ argument behind [[Dadda Tree]]. $E$ is the natural objective if you care about area, since $\sum_{\text{placed}}k$ *is* the LUT bill and $\sum_{\text{placed}}\delta$ is fixed by the heap. Early work optimised $\gamma$; [KK18] showed $E$ is the better objective and costs no stages in most cases, because a high-$E$ GPC on FPGA is one that fills its LUT6 inputs, and filling LUT6 inputs also happens to be dense compression.

**Sort the library once, up front, and delete the dominated entries.** `orderByEfficiency` runs before stage 0 and is never repeated (Listing 7.2, line 3). Row compressors of variable width $k$ have $E=2-\tfrac{2}{k}$ (ternary adder) or $2-\tfrac{1}{k}$ ([[4-2 Compressor]]), so they are ordered by their $k\to\infty$ limit — the optimistic bound, which is what a sorted early-exit needs to stay valid. A GPC that another library entry realises at equal or lower cost on the target is dropped: on AMD the $(7;3)$ costs 2 LUT6 and covers $(6;3)$, so $(6;3)$ never appears. That pruning is target-specific and is the first thing that changes when you retarget.

> [!important]
> The quantity actually maximised is **effective** efficiency, not $E$. When a compressor is trial-placed on column $c$, only the inputs that find a dot to connect to are counted in $b_i$ (line 15). A $(1,3,2,5;5)$ GPC nominally at $E=1.5$ scores far lower against a column that is three dots tall, so the heuristic naturally degrades to cheap compressors as the heap thins — without any explicit stage-dependent library.

**Process the tallest column first, break ties toward the lower weight.** `orderColumnsByHeight` (line 9) runs per stage. Height-first is obvious — the stage's latency is set by the tallest column, so that is where compression buys the most. The tie-break toward lower weight is not obvious: it exists because a GPC placed at column $c$ also drains columns $c+1,\dots$ above it, so starting low means every later placement sees the damage already done rather than fighting over the same dots.

**Two early exits keep the inner loops from being quadratic in the library.** Since the library is sorted, once $E(\text{comp})\le E_{\text{best}}$ no later entry can beat the incumbent even with all inputs connected, so the outer loop breaks (line 13). And if the selected entry is a GPC whose effective efficiency *equals* its nominal $E$ — every input used — nothing further down the sorted list can do better either, so the column loop breaks too (line 22). Together these mean the common case touches only the top few library entries, which is why the whole thing runs in seconds on a 16 384-bit heap while the ILP formulation times out at an hour past a few hundred bits.

**Guarantee forward progress with a pseudo $(1;1)$ GPC.** A stage is done when every dot of `cols[s]` has been removed (line 30), so if some dot were unreachable by every real compressor the loop would never terminate. The library therefore always contains a one-in, one-out "compressor" that is combinationally a plain wire: $b_i=b_o=1$, $\delta=0$, $k=0$. Its efficiency is the worst possible, so the ordering puts it last and it is only ever selected when nothing else fits. The outer `while` terminates on $\max(\text{cols}[s])\le I$ with

$$I=\begin{cases}2 & \text{2-input final add}\\ 3 & \text{ternary final add}\end{cases}\tag{7.29}$$

and control passes to `generateFinalCPA` — see [[Split Final Adder]] for why that adder should not be uniform.

**Pipelining reprices the wire, and the heuristic already does the right thing about it.** In a [[Pipelined Compressor Tree]] the $(1;1)$ pseudo GPC is no longer free: it becomes a flip-flop, charged 0.5 LUT6 on AMD parts because two FFs sit behind every LUT6 (p. 193). No change to the algorithm is needed — because $(1;1)$ sorts last, the heuristic defers dots to a later stage only as a last resort, i.e. it compresses as early as possible, which is exactly what minimises register count in a pipelined tree. On ASIC the accounting is different: every compressor in a pipelined stage carries additional FF cost, whereas the FPGA's basic logic element has an output FF that is usually free to enable.

**One hook, `eff_min`, turns the heuristic into the front half of an optimal flow.** Line 26 aborts the stage when the best effective efficiency falls below a per-stage threshold $\overrightarrow{\text{eff}}_{\min}(s)$; setting it to $0$ means "solve this stage entirely by heuristic", $\infty$ means "leave it to the solver". Pure heuristic runs with $\overrightarrow{\text{eff}}_{\min}=(0,\dots,0)$. The vector should increase monotonically, since early-stage choices barely move the objective and a later optimal phase can repair them; the rule of thumb is heuristic everywhere except the last 2-3 stages.

**What the measurements actually show.** Two benchmark shapes are used (Fig. 7.27, p. 195, redrawn above): `IntMultiAdder` with $w$ inputs of $w$ bits — a rectangle of $w^2$ dots, $w=4\dots128$ in steps of 4, so 16 to 16 384 bits — and `IntMultiplier`, an unsigned $w\times w$ LUT-only multiplier with no DSP, a triangle of $w^2$ dots spread over $2w-1$ columns, 14 to 13 654 bits. Gurobi with a 1-hour timeout, fully pipelined trees, $(1;1)$ priced at 0.5 LUT6. Below 1024 bits (Fig. 7.28, p. 196) most optimal points simply time out; where the optimum is found the gap is visible but not dramatic, with the heuristic needing 4 stages on `IntMultiAdder` where the optimum needs 3.

![LUT cost of the heuristic versus compressed bits, up to 16 384 bits, against a 0.55 LUT/bit reference line](assets/efficiency-heuristic-scaling-218.png)
*Fig. 7.29a, p. 197 — cropped rather than redrawn; it is measured data, not a schematic.*

At full scale the cost is linear at **0.55 LUT6 per compressed bit**, down from 0.65 in [KK18] purely because the newer [Yua+19] GPCs of Table 7.3 entered the library — the algorithm did not change. Stage count saturates at 5-6 across four orders of magnitude of heap size, which is the logarithmic bound of [[Compressor Trees]] doing its work rather than anything the heuristic contributes.

$$\boxed{\ (\text{comp}_{\text{best}},c_{\text{best}})=\arg\max_{\text{comp},\,c}\ \tilde{E}=\frac{b_i^{\text{connected}}(\text{comp},c)-b_o}{k}\ }$$

> [!warning] Not covered in the source — needs outside research
> $E=\delta/k$ measures $k$ in LUT6. The book gives no ASIC cost model for the same heuristic, and gate-count or area-normalised $k$ would reorder the library — most visibly the FA, which is the *worst* compressor on FPGA at $E=1$ and among the best per transistor.

**When it breaks.** The greedy choice is locally optimal only: on small heaps it costs about one extra stage and a visible LUT margin against ILP, which is why the combined flow exists at all. The library ordering is pre-computed from nominal $E$, so a compressor that is excellent only in a rare column shape is never reached. Row compressors need a linear search over width $k=2\dots C$ inside the inner loop, which is the one place the "seconds" claim is under pressure for very wide heaps. Below roughly 100 dots the whole apparatus is pointless — run the ILP, it will return in well under the hour. And with all cost in LUT6, any target without a LUT6 (ASIC, LUT4 devices, or a heap that should have gone to DSP blocks via [[Multiplier Tiling]]) is being scheduled against the wrong objective function.

**The two library entries that bracket the ordering.** The highest-$E$ GPC the heuristic reaches first, and the zero-$\delta$ wire it reaches last:

```spade
/// One weight-1 bit lifted into the 5-bit accumulator width.
fn dot(b: bool) -> uint<5> { zext(b.as_uint()) }

/// The (1,3,2,5;5) GPC of Table 7.3, p. 184: 11 dots in, 5 out,
/// k = 4 LUT6, so E = (11-5)/4 = 1.5 — near the head of the ordered library.
fn gpc_1_3_2_5_5(u: [bool; 5], v: [bool; 2], w: [bool; 3], x: bool) -> uint<5> {
    let su = dot(u[0]) +. dot(u[1]) +. dot(u[2]) +. dot(u[3]) +. dot(u[4]);
    let sv = dot(v[0]) +. dot(v[1]);
    let sw = dot(w[0]) +. dot(w[1]) +. dot(w[2]);
    su +. (sv << 1) +. (sw << 2) +. (dot(x) << 3)
}

/// The pseudo (1;1) GPC, combinational: a wire, k = 0, always ordered last.
fn pseudo_gpc(d: bool) -> bool { d }

/// The same pseudo GPC in a pipelined tree: one FF, priced 0.5 LUT6.
entity pseudo_gpc_reg(clk: clock, d: bool) -> bool {
    reg(clk) q = d;
    q
}
```

`u`,`v`,`w`,`x` are the four weight groups of the dot transformation in Fig. 7.23 — 5 dots at weight $2^0$, 2 at $2^1$, 3 at $2^2$, 1 at $2^3$ — and the `uint<5>` result is the output column of 5 dots. The maximum is $5+2\cdot2+4\cdot3+8=29<32$, so every `+.` and `<<` is exact despite being the truncating variant; that headroom argument is the whole reason $q=\lceil\log_2(29+1)\rceil=5$ and not 6. All of it is combinational except `pseudo_gpc_reg`, which is the *only* register the heuristic ever charges for. Synthesis will not build this as an adder tree: on an AMD target the four LUT6s each see six of the eleven inputs and the fast carry chain assembles $z_0\dots z_4$ (Fig. 7.22, p. 183), which is what makes $k=4$ true — write it as arithmetic and let the mapper find the slice.

**Related notes.**

- [[Generalized Parallel Counter]] – depends-on: the library entries this heuristic sorts, and where $E$ and $q=\lceil\log_2(\sum 2^jp_j+1)\rceil$ come from.
- [[Compressor Trees]] – supports: the stage-count bound the heuristic saturates against.
- [[Dadda Tree]] – compares: the fixed-library ancestor, greedy on $\gamma$ with FA/HA only.
- [[Wallace Tree]] – compares: reduces everything reducible per stage instead of ranking by cost.
- [[Choosing a Compressor Tree]] – compares: where this sits against ILP and the fixed-library algorithms.
- [[Pipelined Compressor Tree]] – extends: reprices the $(1;1)$ pseudo GPC at 0.5 LUT6 and turns the ordering into a register-minimising one.
- [[4-2 Compressor]] – counter-example: a row compressor, so its efficiency $2-\tfrac{1}{k}$ depends on a width the inner loop has to search rather than look up.
- [[Split Final Adder]] – extends: what `generateFinalCPA` should do with the $\le I$ rows this leaves behind.
- [[Lookup-Tables]] – depends-on: $k$ is counted in LUT6, so the whole objective function is an FPGA artefact.
- [[Multiplier Tiling]] – counter-example: on a DSP-bearing device the heap should be shrunk before compression, not compressed harder.
- [[FloPoCo]] – supports: `compression=heuristicMaxEff` selects this algorithm; `flopoco compression=heuristicMaxEff IntMultiAdder n=10 signedIn=0 wIn=10` reproduces the left-hand shape above (p. 195).

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7.

- §7.3.2 A bestiary of compressors, pp. 180–186 — (7.27) efficiency, (7.28) compression ratio, Fig. 7.22 the $(1,3,2,5;5)$ slice mapping, Table 7.3 the ordered library, Fig. 7.23 dot transformations.
- §7.3.3.1 A universal heuristic, pp. 186–189 — (7.29), Listing 7.2.
- §7.3.3.3 Combined heuristic with ILP, pp. 192–193 — $\overrightarrow{\text{eff}}_{\min}$, Fig. 7.26.
- §7.3.3.4 Pipelined compressor trees, p. 193 — the 0.5 LUT6 pseudo GPC.
- §7.4 Experimentations, pp. 194–197 — Figs. 7.27–7.29.
