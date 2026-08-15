---
title: Crossbar Switch
description: "p independent p:1 muxes replicated w times — any-input-to-any-output in one cycle, at p^2*w crosspoints, the term that makes high radix quadratically expensive."
kind: circuit
source: "No book source — Dally & Towles chs. 3, 17; Weste & Harris ch. 11"
status: seed
spade: simulated
tags: [digital, network-on-chip, crossbar, mux, router]
aliases:
  - Crossbar
  - Crossbar Switch
  - Crosspoint Switch
  - Switch Fabric
  - Router Crossbar
---

# Crossbar Switch

The non-blocking switch of a router: $p$ inputs, $p$ outputs, and an unrestricted map from any input to any output in a single cycle, bought at $p^2$ crosspoints of $w$ bits each.

```tikz title="p x p crossbar: crosspoint matrix and its p:1 mux equivalent, p=5"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % ================= left: crosspoint matrix =================
  \node[anchor=west,font=\bfseries] at (-1.9,5.4) {crosspoint view};
  \foreach \i/\y in {0/4,1/3,2/2,3/1,4/0}{
    \draw[gray] (-1.5,\y) -- (5.4,\y);
    \node[anchor=east,font=\footnotesize] at (-1.55,\y) {in $\i$};
    \node[anchor=south,font=\footnotesize] at (-0.95,\y+0.06) {$w$};}
  \foreach \j in {0,1,2,3,4}{
    \draw[gray] (0.5+\j,4.7) -- (0.5+\j,-1.5);
    \node[anchor=north,font=\footnotesize,rotate=90] at (0.5+\j,-1.55) {out $\j$};}
  \foreach \j in {0,1,2,3,4}{ \foreach \y in {0,1,2,3,4}{
    \node[ocirc,scale=0.75,gray] at (0.5+\j,\y) {};}}
  % active permutation: out0<-in2, out1<-in4, out2<-in0, out3<-in3, out4<-in1
  \foreach \j/\y in {0/2, 1/0, 2/4, 3/1, 4/3}{
    \draw[line width=1.3pt] (-1.5,\y) -- (0.5+\j,\y) -- (0.5+\j,-1.5);
    \node[circ,scale=0.85] at (0.5+\j,\y) {};}
  \node[anchor=west,font=\footnotesize,text width=6.6cm] at (-1.9,-2.65)
    {$p^2$ crosspoints, each $w$ bits wide $\Rightarrow p^2w$. At most one
     closed per column (an output takes one input); more than one per row is
     legal and is a broadcast.};

  % ================= right: mux equivalent =================
  \begin{scope}[xshift=10.4cm]
  \node[anchor=west,font=\bfseries] at (-2.3,5.4) {equivalent: one $p{:}1$ mux per output};
  \draw[fill=white] (0.6,4.5) -- (1.7,3.7) -- (1.7,0.3) -- (0.6,-0.5) -- cycle;
  \node[rotate=90,font=\footnotesize] at (1.15,2.0) {$p{:}1$};
  \foreach \i/\y in {0/4,1/3,2/2,3/1,4/0}{
    \draw[->] (-1.5,\y) -- (0.6,\y);
    \node[anchor=south,font=\footnotesize] at (-0.45,\y+0.06) {in $\i$: $w$};}
  \draw[->] (1.7,2.0) -- (3.9,2.0);
  \node[anchor=south,font=\footnotesize] at (2.8,2.06) {out $j$: $w$};
  \draw[->] (1.15,-1.5) -- (1.15,-0.06);
  \node[anchor=north,font=\footnotesize] at (1.15,-1.55) {$\mathrm{sel}_j$: $\lceil\log_2 p\rceil$};
  \node[anchor=west,font=\footnotesize,text width=6.4cm] at (-2.3,-2.65)
    {$p$ independent copies, $w$ bits each. The $p$ select fields are the
     switch allocator's grant, $p\lceil\log_2 p\rceil$ bits total; no state,
     no feedback, one cycle.};
  \end{scope}
\end{circuitikz}
\end{document}
```

**Write the switch as a Boolean matrix and the muxes fall out.** Let the inputs be $\mathrm{in}_0,\dots,\mathrm{in}_{p-1}$, each $w$ bits, and let $x_{ij}\in\{0,1\}$ be the state of the crosspoint joining input $i$ to output $j$ — one bit, $p^2$ of them. Output $j$ is the OR of every input the closed crosspoints of its column admit, the scalar $x_{ij}$ broadcast across all $w$ bits of the word:

$$\mathrm{out}_j \;=\; \bigvee_{i=0}^{p-1}\bigl(x_{ij}\wedge \mathrm{in}_i\bigr),\qquad j=0,\dots,p-1.$$

Every term of that sum belongs to column $j$ alone, so the $p$ outputs share **no logic whatsoever** — the matrix is $p$ disjoint circuits, not one. Impose the legality constraint $\sum_i x_{ij}\le 1$ (below) and the column vector $x_{\cdot j}$ is one-hot, at which point the expression is the canonical one-hot multiplexer of [[Multiplexers]]: $\mathrm{out}_j=\mathrm{mux}(\mathrm{sel}_j;\mathrm{in}_0,\dots,\mathrm{in}_{p-1})$ with $\mathrm{sel}_j$ of $\lceil\log_2 p\rceil$ bits. A crossbar is $p$ independent $p{:}1$ muxes, each replicated $w$ times bitwise. Nothing else.

> [!note] The two constraints are not symmetric, and that asymmetry is the whole interface
> A column may have at most one closed crosspoint, because two would OR two distinct payloads into one wire and destroy both. A *row* has no such limit: closing $x_{i j}$ for several $j$ fans one input out to several outputs, which is a legal, free **broadcast** — the crossbar's one piece of extra capability over a permutation network. So the crossbar cannot resolve contention and does not try; enforcing one-input-per-output is the [[Separable Input-First Allocator]]'s job, and the switch simply trusts the grant it is handed.

**The crosspoint count is where radix stops being free.** Each of the $p^2$ crosspoints carries a $w$-bit word, so the switch is $p^2w$ crosspoints of area and $p^2w$ transistor-or-LUT sites. For the canonical $p=5$, $w=128$ router that is $3{,}200$ — small next to the $pVBw=15{,}360$ bits of input buffer, and that comparison is why crossbar area is usually dismissed. The dismissal is about the *constant*, not the *trend*: buffers grow linearly in $p$ while the switch grows quadratically, so halving a mesh's diameter by doubling radix costs $2\times$ the buffers and $4\times$ the switch. Radix is the number to watch precisely because it is the only term with an exponent.

**Push $p$ to $N$ and you get a topology, and it is the one that cannot be built.** A single $N$-port crossbar is the ideal network on every metric that ignores geometry — diameter $D=1$, bisection $B_B = (N/2)w$, and therefore, by $\lambda_{\max}=2B_B/Nw$ from [[Network-On-Chip]], a saturation throughput of exactly $1$ flit/cycle/node. Its switch area is $N^2w$. That $N^2$ is the entire reason a NoC exists: at $N=64$, $w=128$ a flat crossbar is half a million crosspoints, and worse, its $N/2$ bisection channels must physically cross a die cut that admits only $\Theta(\sqrt N)$ wire tracks. The mesh's $\sqrt N$ bisection saturates the planar budget exactly; the crossbar demands $\Theta(\sqrt N)$ times more metal than a plane has room for. The crossbar survives *inside* the router, at $p=5$, where $p^2$ is $25$ and geometry is not yet an argument.

**Control comes in two encodings and the allocator picks the winner.** The one-hot form uses the $p^2$ bits $x_{ij}$ directly: $p^2$ control wires, no decoding, and the mux degenerates to a row of AND-OR (or, on ASIC, one pass transistor per crosspoint driving a shared output line). The binary form ships $p$ select fields of $\lceil\log_2 p\rceil$ bits — $p\lceil\log_2 p\rceil$ wires, $15$ bits instead of $25$ at $p=5$ — and pays a $\lceil\log_2 p\rceil\!\to\!p$ decoder per output to regenerate the one-hot vector inside the mux. The switch allocator's arbiters are priority encoders and their grants are *already* one-hot ([[Round-Robin Arbiter]]), so the one-hot form deletes both an encoder at the allocator and a decoder at the switch. Binary control is worth it only when the select must be registered or cross a long wire, where $p\lceil\log_2 p\rceil$ flops beat $p^2$.

**Delay is a tree in LUTs and an $RC$ load in transistors, and the two scale differently.** Built from $k$-input mux primitives the depth is $\lceil\log_k p\rceil$ levels, so the logic path grows *logarithmically* in radix even as area grows quadratically. The transmission-gate crossbar has no logic depth at all — one pass gate from input to output — but every one of the $p$ crosspoints on an output line contributes a diffusion capacitance to it and every one of the $p$ crosspoints on an input line loads the driver, so the $RC$ delay of the shared line rises roughly linearly in $p$ and the wire, not the gate, sets the period. The lesson generalises: past modest $p$ the crossbar is a *wiring* problem, which is exactly the regime where the log-depth [[Barrel Shifters]] construction — $\log_2 p$ stages of $2{:}1$ muxes, $O(p\log p)$ switches instead of $p^2$ — becomes the better shape, at the price of losing arbitrary permutation and keeping only cyclic shift.

**On FPGA the arity of the LUT sets the design point.** A $p{:}1$ mux of $w$ bits is $w$ instances of a $p{:}1$ mux of one bit. A 6-input LUT natively implements a $4{:}1$ mux — four data inputs plus two selects exhausts it exactly — so a $5{:}1$ mux costs 2 LUTs plus a dedicated wide-mux resource ([[Lookup-Tables]]). At $p=5$, $w=64$ the crossbar alone is roughly $5\times 64\times 2\approx 640$ LUTs. Dropping radix to $4$, by muxing the local port onto an existing direction, brings it to one LUT per bit per output and halves that. The saving comes from LUT arity, not from graph theory, and it does not exist on ASIC — which is the general shape of FPGA arithmetic: the primitive's fan-in, not the gate count, is the cost model.

**In the pipeline it is one stage and it holds nothing.** The crossbar is the ST stage of the router: purely combinational, no registers, no feedback, driven by the select fields the SA stage produced in the previous cycle and feeding the output register on the far side. Because it is stateless it never needs reset, never needs a stall input, and can be speculated through freely — [[Speculative Switch Allocation]] works precisely because a wrong crossbar select costs a discarded flit and no corrupted state.

$$\boxed{\ \mathrm{out}_j=\bigvee_{i=0}^{p-1}\bigl(x_{ij}\wedge \mathrm{in}_i\bigr),\quad \textstyle\sum_i x_{ij}\le 1,\quad p^2w\ \text{crosspoints},\quad p\lceil\log_2 p\rceil\ \text{control bits},\quad \lceil\log_k p\rceil\ \text{levels}\ }$$

**When it breaks.**

- **Non-power-of-two $p$ leaves the select under-specified.** With $p=5$ and a 3-bit $\mathrm{sel}_j$, codes $5,6,7$ address nothing; the emitted hardware is an out-of-range part-select and simulates as $X$. Synthesis will happily treat them as don't-cares and optimise, so the allocator must be trusted never to emit them — or the mux needs an explicit default arm, which costs the optimisation back.
- **The area constant misleads until it doesn't.** At $p=5$ the switch is a fifth of the buffers and nobody notices; at $p=16$ it is $10\times$ the $p=5$ switch while the buffers have only grown $3.2\times$, and the crossbar is suddenly the floorplan.
- **Delay stops being logarithmic before area stops being quadratic.** The tree-depth argument assumes the mux is logic. Once $p$ is large enough that the output line's $RC$ dominates, adding radix costs linear delay on top of quadratic area, and the flat crossbar loses to a two-stage or Clos-style decomposition.
- **It is non-blocking, not contention-free.** Every legal permutation routes, but "legal" already assumes the allocator produced a matching. Under load the limit is the matching quality, not the switch — see the [[Wavefront Allocator]] for what a better matching buys and what it costs in delay.
- **Broadcast is free in the switch and not in the flow control.** Closing several crosspoints in a row costs nothing, but each destination has its own credit counter ([[Credit-Based Flow Control]]), so a multicast flit is only sendable when *all* its destinations have room — the conjunction, not the disjunction, and that is where multicast NoCs get complicated.

**RTL (Spade).**

```spade
/// One output port of a p x p crossbar: a P:1 mux over W-bit words.
fn xbar_port<#uint P, #uint W, #uint S>(din: [uint<W>; P], sel: uint<S>) -> uint<W> {
    din[sel]
}

/// Full 5x5, 8-bit crossbar: p independent port muxes, no shared logic.
entity xbar5(din: [uint<8>; 5], sel: [uint<3>; 5]) -> [uint<8>; 5] {
    [ xbar_port(din, sel[0]),
      xbar_port(din, sel[1]),
      xbar_port(din, sel[2]),
      xbar_port(din, sel[3]),
      xbar_port(din, sel[4]) ]
}
```

`din` is the five horizontal input lines of the diagram, `sel[j]` is the binary encoding of column $j$'s one-hot crosspoint vector $x_{\cdot j}$, and the five calls to `xbar_port` are the five vertical output lines — the fact that the body is a literal array of five independent calls *is* the claim that the columns share no logic. Widths: $5\times 8$ in, $5\times 3$ select, $5\times 8$ out, and none of them grow, because a crossbar computes no arithmetic and a mux is the one datapath element with no width rule to get wrong. The entity is combinational despite the `entity` keyword, which is needed here only because `fn` cannot be a synthesis top level. What synthesis does differently from the drawing: `din[sel]` emits as the Verilog part-select `din[sel*8 +: 8]`, which an ASIC flow maps to a pass-transistor matrix and an FPGA flow maps to two LUT6 levels per bit — neither of them the AND-OR array the Boolean expression above literally describes.

**Related Notes.**

- [[Multiplexers]] – depends-on: the crossbar is exactly $p$ of these, replicated $w$ times; every cost in this note is a mux cost multiplied out.
- [[Lookup-Tables]] – depends-on: LUT6 arity is what makes $p=4$ half the price of $p=5$ on FPGA.
- [[Barrel Shifters]] – compares: $O(p\log p)$ switches in $\log_2 p$ stages instead of $p^2$ in one, at the cost of serving only cyclic shifts rather than arbitrary permutations.
- [[Separable Input-First Allocator]] – supports: produces the one-input-per-output matching the crossbar assumes but cannot check.
- [[Round-Robin Arbiter]] – supports: its grants are already one-hot, which is why one-hot crosspoint control needs no decoder.
- [[Virtual-Channel Router]] – supports: the crossbar is the ST stage of that pipeline and the only stage holding no state.
- [[Speculative Switch Allocation]] – extends: safe to speculate through precisely because the switch is stateless.
- [[Wavefront Allocator]] – compares: a better matching for the same switch, trading allocator delay for crossbar utilisation.
- [[Credit-Based Flow Control]] – depends-on: a grant is only issued when the downstream credit is non-zero, so the crossbar never selects a path that would drop a flit.
- [[Network-On-Chip]] – counter-example: taken to $p=N$ the crossbar is the ideal topology on paper and unbuildable on a plane, which is the reason the rest of that topic exists.

## References

- Dally & Towles, *Principles and Practices of Interconnection Networks* (Morgan Kaufmann, 2004) — ch. 3 for the topology metrics and the $N^2w$ switch-area term, chs. 16–17 for the router pipeline and the crossbar's place in it, chs. 18–19 for allocators and the matching the switch assumes.
- Weste & Harris, *CMOS VLSI Design*, 4th ed., ch. 11 (datapath subsystems) — pass-transistor mux structures and the loaded-output-line delay argument; ch. 6 for wire $RC$.
- Mano & Ciletti, *Digital Design* — the one-hot $\mathrm{out}=\bigvee_i(x_i\wedge\mathrm{in}_i)$ multiplexer normal form and the $\lceil\log_2 p\rceil\to p$ decoder.
- Local: [[Network-On-Chip]] §"Router microarchitecture" (crosspoint count and the $p=5,V=4,B=6,w=128$ area table), §"FPGA mapping" (LUT6 arity and the $\approx640$-LUT figure), §"Topologies in closed form" (crossbar row, $\lambda_{\max}=2B_B/Nw$, and the planar bisection argument).
