---
title: Generalized Parallel Counter
description: "A (p_(n−1),…,p_0;q) cell absorbing inputs of different weights at once; a 6-input LUT tabulates any GPC under six inputs outright and the fast carry chain fits a (1,3,2,5;5) into one AMD slice at efficiency 1.5 — which is why the plain full adder is the worst compressor on FPGA."
kind: circuit
source: "ASA §7.3.2.3-7.3.2.5, pp. 182-186"
status: seed
spade: simulated
tags: [digital, sums-of-weighted-bits, fpga, compressor]
aliases:
  - GPC
  - GPCs
  - Generalized Parallel Counters
  - Multicolumn Counter
---

# Generalized Parallel Counter

A generalized parallel counter is a compressor whose input bits may sit in *different* columns of a bit heap — the tuple $(p_{n-1},\dots,p_0;q)$ records how many bits of each weight it eats — which is the one shape that lets a 6-input LUT and a fast carry chain be filled at an efficiency the full adder cannot reach.

```tikz title="A (1,3,2,5;5) generalized parallel counter: dot transformation and its mapping onto one AMD slice"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % ---------------- left: dot transformation of (1,3,2,5;5) ----------------
  \node[anchor=south,font=\small] at (-0.9,2.35) {$(1,3,2,5;5)$};
  \foreach \c/\h in {0/5,1/2,2/3,3/1}
    \foreach \r in {1,...,\h} \fill (-0.45*\c,0.30*\r) circle (2.2pt);
  \foreach \c/\w in {0/1,1/2,2/4,3/8}
    \node[anchor=north,font=\tiny] at (-0.45*\c,0.10) {\w};
  \node[anchor=north,font=\tiny] at (-0.68,-0.22) {input weights, 11 bits};
  \node[font=\small] at (-0.68,-0.75) {$\Downarrow$};
  \foreach \c in {0,...,4} \fill (-0.45*\c,-1.30) circle (2.2pt);
  \foreach \c/\w in {0/1,1/2,2/4,3/8,4/16}
    \node[anchor=north,font=\tiny] at (-0.45*\c,-1.42) {\w};
  \node[anchor=north,font=\tiny] at (-0.9,-1.74) {$z_4\ldots z_0$, 5 bits};
  \node[anchor=north,font=\tiny] at (-0.9,-2.14) {$\delta=11-5=6$ dots removed};

  % ---------------- right: slice mapping ----------------
  \begin{scope}[xshift=4.4cm]
    \draw[dashed] (-0.25,-1.40) rectangle (6.65,1.85);
    \node[anchor=north west,font=\tiny] at (-0.25,-1.48)
      {one AMD slice: 4 LUT6 $+$ CARRY4};

    \foreach \i/\lbl/\n in {0/{$u_0\ldots u_4$}/5, 1/{$v_0,v_1$}/2,
                            2/{$w_0\ldots w_2$}/3, 3/{$x_0$}/1}{
      \draw (1.7*\i,0.85) rectangle (1.7*\i+1.25,1.55);
      \node[font=\tiny] at (1.7*\i+0.62,1.20) {LUT6};
      \draw[->] (1.7*\i+0.62,2.45) -- node[right,font=\tiny] {\n} (1.7*\i+0.62,1.55);
      \node[anchor=south,font=\tiny] at (1.7*\i+0.62,2.47) {\lbl};
      \draw (1.7*\i,-0.30) rectangle (1.7*\i+1.25,0.35);
      \node[font=\tiny] at (1.7*\i+0.62,0.02) {XOR/MUX};
      \draw[->] (1.7*\i+0.62,0.85) -- node[right,font=\tiny] {2} (1.7*\i+0.62,0.35);
      \draw[->] (1.7*\i+0.62,-0.30) -- node[right,font=\tiny] {1} (1.7*\i+0.62,-0.90);
    }
    \foreach \i in {0,1,2,3}
      \node[anchor=north,font=\tiny] at (1.7*\i+0.62,-0.92) {$z_\i$};

    % carry chain, LSB on the left
    \node[anchor=east,font=\tiny,align=right] at (-0.60,0.02)
      {fast carry chain\\$c_{\text{in}}=0$};
    \draw[->] (-0.55,0.02) -- (0,0.02);
    \foreach \i in {0,1,2} \draw[->] (1.7*\i+1.25,0.02) -- (1.7*\i+1.7,0.02);
    \draw[->] (6.35,0.02) -- (7.10,0.02);
    \node[anchor=west,font=\tiny] at (7.15,0.02) {$z_4=c_{\text{out}}$};
  \end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 7.22, p. 183 and Fig. 7.23, p. 185.*

**Drop the single-column restriction and the counter becomes a family.** A [[Parallel Counter]] $(p;q)$ consumes $p$ bits that all carry the same weight. A GPC — the older literature calls it a *multicolumn counter* [Meo75; SKG77; EL04] — lets $p_j$ of its inputs carry weight $2^j$, for $j=0\dots n-1$, and is written **most significant first**: in $(p_{n-1},\dots,p_1,p_0;q)$ the rightmost entry before the semicolon is the weight-$1$ column. It emits the binary encoding of the weighted sum on $q$ bits placed in columns $0\dots q-1$, so in the dot-diagram calculus of [[Bit Heaps]] a GPC replaces a ragged pile of dots by one horizontal *row*. Its correctness condition is nothing more than the compressor invariant $\sum_k 2^{p_k}\mathrm{in}_k=\sum_k 2^{q_k}\mathrm{out}_k$, so a GPC may be substituted into a heap anywhere its shape fits without touching $V(\mathcal{B})$.

**Fix the output width from the input range.** The largest value the cell can see is $\sum_{j=0}^{n-1}2^jp_j$, reached with every input at $1$, so the output must span $0\dots\sum_j 2^jp_j$ — that is $\sum_j 2^jp_j+1$ distinct values, and a binary encoding of $m$ values needs $\lceil\log_2 m\rceil$ bits (7.26, p. 182):

$$q=\Big\lceil\log_2\Big(\sum_{j=0}^{n-1}2^jp_j+1\Big)\Big\rceil .$$

A $(3,5;4)$ sums three weight-$2$ bits and five weight-$1$ bits: range $0\dots 2\cdot3+5=11$, twelve values, $q=4$. The GPC of the diagram, $(1,3,2,5;5)$, reaches $8+12+4+5=29$, thirty values, $q=5$. Input bundle: $b_i=\sum_j p_j=11$ wires spread over four columns; output row: $b_o=q=5$ wires in five consecutive columns.

**Score a compressor by what it deletes, not by what it computes.** The two metrics (p. 183) are the **efficiency** or *area degree* [Bru+13; Par+11] and the **compression ratio** or *compression factor* [PBI08a]:

$$E=\frac{b_i-b_o}{k}=\frac{\delta}{k},\qquad \gamma=\frac{b_i}{b_o},$$

with $k$ the number of LUT6 the cell costs. $\delta$ is the number of dots the heap loses, so $E$ is dots removed per LUT — a pure area-per-progress rate. $\gamma$ measures how fast the heap gets *shorter* and early work optimized it [PBI08a; Bru+13], but [KK18] showed that ordering by $E$ reduces resources without costing a stage in most cases, so $E$ is what [[Efficiency-Driven Compression Heuristic]] sorts on. For $(1,3,2,5;5)$: $\delta=11-5=6$, $k=4$, $E=1.5$, $\gamma=2.2$.

**A LUT6 tabulates any GPC of at most six inputs — and that is exactly why such GPCs are all mediocre.** With $b_i\le 6$ every input bit fits inside one LUT's fan-in, so each output bit is a truth table over the same variables and needs one LUT6 of its own: $k=q$. With $b_i\le5$ the LUT6 fractures into two LUT5s over shared inputs, so two output bits come out of one LUT and $k=\lceil q/2\rceil$. That rule reproduces every LUT-only row of Table 7.3 (p. 184) — $(3;2)$ at $k=1$, $(2,3;3)$ at $k=2$, $(6;3)$ and $(1,5;3)$ at $k=3$ — and it bounds $E$. If $b_i=6$ the smallest reachable range is $0\dots6$, so $q\ge3$ and $E=(6-q)/q\le1$. If $b_i=5$ the range is at least $0\dots5$, so again $q\ge3$ and $E=(5-q)/\lceil q/2\rceil\le 2/2=1$. **No GPC that fits one LUT's fan-in can exceed $E=1$**, and indeed the whole LUT-only block of Table 7.3 sits at exactly $1$.

> [!important] The full adder is the worst compressor on an FPGA, not merely an unremarkable one
> A $(3;2)$ occupies a LUT6 — six input pins, a 64-entry truth table — to delete a single dot. It hits the $E=1$ ceiling only because that ceiling is low: it is at the top of a family that is capped by LUT fan-in, and every carry-chain GPC in Table 7.3 beats it by $1.5\times$ to $2\times$. Minimizing full-adder count, which is the entire objective of [[Dadda Tree]] and [[Reduced Area Compressor Tree]], is therefore not minimizing area on FPGA.

**Escaping $E=1$ requires more than six input bits, which requires the carry chain.** Carry-save was long thought a bad fit for FPGAs precisely because the dedicated chain makes ordinary adders fast while carry-save logic lands in slow generic routing. Parandeh-Afshar et al. [PBI08a; PBI08b] inverted the argument (p. 182): recruit the chain *inside* the compressor. Fig. 7.22 fits $(1,3,2,5;5)$ into a single AMD slice — the four LUT6 pre-reduce their columns to the two signals a carry cell wants (a propagate/sum bit and a data bit), and the CARRY4 chain resolves the horizontal carries, producing $z_0\dots z_3$ plus $c_{\text{out}}=z_4$. Eleven bits enter, five leave, $k=4$, and the delay is $\tau_L+4\tau_{CC}\approx\tau$ because $\tau_{CC}\ll\tau_L\approx\tau_R\approx\tau$: a cell that eats eleven bits costs about one LUT delay. The chain is free capacity that a pure-LUT compressor simply leaves idle.

**The best shapes are the ones that saturate the output and spend their range on cheap bits.** For a fixed $q$ the constraint is $\sum_j 2^jp_j\le 2^q-1$; $b_i=\sum_j p_j$ is what you want to maximize, and a bit of weight $2^j$ consumes $2^j$ of the budget, so **low-weight inputs are cheap and high-weight inputs are expensive**. $(6,0,7;5)$ spends $6\cdot4+7=31=2^5-1$ — exactly saturating, no output code wasted — on thirteen bits, of which seven sit in the cheapest column; it gets $\delta=8$ from the same $k=4$ and reaches $E=2$, the maximum in Table 7.3. $(1,3,2,5;5)$ reaches only $29$, wasting two of the thirty-two codes, and gets $E=1.5$ for identical area. $(1,4,0,7;5)$ saturates too but pays $8+16$ of its budget for five expensive bits and lands between, at $E=1.75$. The arithmetic bound alone would push everything to weight $1$ — the plain counter $(31;5)$, $b_i=31$ — but that shape needs thirty-one input pins and does not map, so **the binding constraint on a GPC library is the slice, not the arithmetic**.

> [!warning] Table 7.3's $(7;3)$ row is internally inconsistent
> The row (p. 184) prints $k=2$ and $E=1.33$. Definition (7.27) applied to its own numbers gives $E=(7-3)/2=2$; the printed $1.33=4/3$ is what $k=3$ would give. The delay column, $\tau_L+2\tau_{CC}$ — two carry stages — sides with $k=2$. One of the two figures is a misprint and the text does not say which; if $k=2$ and $E=2$ both stood, a $(7;3)$ would match the best GPC in the table at half the LUT cost, which the surrounding prose ("the GPCs optimized for the carry chains provide the best efficiency") does not claim. Do not use this row for a cost model.

**Row adders are GPCs of unbounded width, and they are how the chain gets used at scale.** Because propagation is nearly free on the chain, an adder is a legitimate compressor here (p. 184). A 2-input adder of $k$ bits has $b_i=2k$, $b_o=k$, cost $k$ LUT6, so $E=1$ flat — no better than a full adder. A [[Ternary Adder]] reaches $E=2-2/k\to2$ but costs $2\tau_L+\tau_R+k\tau_{CC}\approx3\tau+k\tau_{CC}$, three LUT delays. The [[Carry-Chain 4-2 Compressor]] of Fig. 7.24 keeps the chain but *saves* the carry as an extra output row instead of propagating it into the next adder, buying $E=2-1/k$ at $\tau_L+k\tau_{CC}$ — slightly better efficiency than the ternary adder at a third of the delay.

**The consequence for synthesis is that the library stops being uniform.** An FPGA compressor library is large, irregularly shaped and non-uniform in cost, which is precisely the regime in which a schedule that counts full adders has nothing useful to say. What survives is covering: order the compressors by $E$, order the columns by height, and greedily place the cell with the best *effective* efficiency, counting only the inputs actually connected in that column ([[Efficiency-Driven Compression Heuristic]], Listing 7.2, p. 188). A pseudo $(1;1)$ GPC — a bare wire, cost $0$ combinationally — is always in the library so that every dot has somewhere to go and the stage loop terminates.

$$\boxed{\ q=\Big\lceil\log_2\Big(\textstyle\sum_j 2^jp_j+1\Big)\Big\rceil,\qquad E=\frac{b_i-q}{k},\qquad E\le1\ \text{ whenever } b_i\le 6\ }$$

**When it breaks.**

- **The shape has to be present in the heap.** A GPC's nominal $E$ assumes all $b_i$ inputs are connected; a heap whose column $j$ holds fewer than $p_j$ dots yields a lower *effective* efficiency, and that is the normal case rather than the exception — it is why the heuristic recomputes $E$ per column instead of using the table value.
- **Every $k$ in Table 7.3 is an AMD 6-LUT + CARRY4 number.** Intel/Altera ALMs fracture differently and carry a shared-arithmetic mode; a Versal LUT feeds a different carry structure. The $E\le1$ bound survives any 6-input LUT, but the carry-chain rows do not transfer, and neither does the claim that $(6,0,7;5)$ is best.
- **On ASIC the metric evaporates.** There is no LUT, so cost is gate count and delay is gate delay, and the [[Full Adder]] is the efficient primitive again. GPC efficiency is a statement about FPGA slices, not about arithmetic.
- **Tall GPCs die at the end of the tree.** Once the heap is shorter than the cell's tallest column, the cell no longer fits and the last stages fall back to $(3;2)$, $(2;2)$ and the $(1;1)$ wire — the same failure mode that limits a [[Parallel Counter]], made milder only because a GPC spreads its demand across several columns instead of stacking it in one.
- **Pipelining reprices the wire.** The $(1;1)$ pseudo-GPC becomes a flip-flop, charged at $0.5$ LUT6 on AMD (two FFs per LUT6), so it is no longer free and the heuristic's habit of picking it last starts to matter.
- **Vertically chaining GPCs through the same carry chain serialises them.** The $\tau_L+4\tau_{CC}\approx\tau$ figure holds for one cell with $c_{\text{in}}$ tied to $0$; a long chain re-imports the propagation delay the compressor tree exists to avoid.

**State the invariant, let the mapper find the slice.** The RTL below is the $(1,3,2,5;5)$ of the diagram, written as the weighted population count it is defined to be.

```spade
fn u5(b: bool) -> uint<5> { zext(b.as_uint()) }

/// (1,3,2,5;5): one bit of weight 8, three of weight 4,
/// two of weight 2, five of weight 1 -> a 5-bit row.
entity gpc_1_3_2_5(c3: bool, c2: uint<3>, c1: uint<2>, c0: uint<5>) -> uint<5> {
    let b2 = c2.as_bits();
    let b1 = c1.as_bits();
    let b0 = c0.as_bits();
    let n0: uint<5> = u5(b0[0]) +. u5(b0[1]) +. u5(b0[2]) +. u5(b0[3]) +. u5(b0[4]);
    let n1: uint<5> = u5(b1[0]) +. u5(b1[1]);
    let n2: uint<5> = u5(b2[0]) +. u5(b2[1]) +. u5(b2[2]);
    n0 +. (n1 << 1) +. (n2 << 2) +. (u5(c3) << 3)
}
```

`c0`…`c3` are the four input columns of the left half of the diagram, one `uint<w>` per column used as a *bag* of $p_j$ same-weight bits, not as a number — hence `as_bits()` and the per-bit sum. The shifts are the weights $2^j$, so the returned `uint<5>` is $z_4\dots z_0$. Everything is truncating (`+.`, `<<`) and held at 5 bits deliberately: the maximum is $29<32$, so no intermediate can overflow, and using the widening `+` would grow the accumulator to 9 bits for no reason. The block is purely combinational — no `clk`, no `reg`. What synthesis does differently from the drawing: nothing here names a LUT or a CARRY4. This entity states the compression *invariant*; mapping it onto four LUT6 and the chain as in Fig. 7.22 is the vendor tool's job (or a hand-instantiated `CARRY4` in a production GPC library), and whether it costs four LUTs or seven is exactly what $E$ is measuring.

**Related notes.**

- [[Parallel Counter]] – extends: the GPC is the same cell with the one-column restriction lifted, which is what makes it mappable.
- [[Bit Heaps]] – depends-on: supplies the weighted-sum invariant that is the GPC's whole correctness condition.
- [[Lookup-Tables]] – depends-on: the 6-input fan-in and the fracture into two LUT5s are what cap $E$ at 1 and set every $k$ in the table.
- [[FPGAs]] – depends-on: the fast carry chain is the resource the interesting GPCs recruit; without it the family collapses to $E\le1$.
- [[Full Adder]] – counter-example: the minimal ASIC compressor is the *worst* FPGA compressor, one LUT6 spent per dot removed.
- [[Ternary Adder]] – compares: a row compressor reaching $E\to2$, but at three LUT delays instead of one.
- [[Carry-Chain 4-2 Compressor]] – compares: keeps the chain and saves the carry instead of propagating it, $E=2-1/k$ at $\tau_L+k\tau_{CC}$.
- [[Efficiency-Driven Compression Heuristic]] – supports: the covering algorithm that consumes a GPC library ordered by $E$.
- [[Dadda Tree]] – counter-example: minimizing full-adder count is the right ASIC objective and the wrong FPGA one.
- [[Choosing a Compressor Tree]] – compares: where a GPC library sits against FA-only scheduling and against ILP.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 7.

- §7.3.2.3 Generalized parallel counters, p. 182 — (7.26), the $(3,5;4)$ example.
- §7.3.2.4 Generalized parallel counters for FPGAs, pp. 182–184 — Fig. 7.22, (7.27) efficiency, (7.28) compression ratio, Table 7.3.
- §7.3.2.5 Row compressors for FPGAs, pp. 184–186 — Fig. 7.23 dot transformations, Fig. 7.24 the 4:2 slice mapping.
- §7.3.3.1 A universal heuristic, pp. 187–188 — Listing 7.2, effective efficiency, the pseudo $(1;1)$ GPC.
