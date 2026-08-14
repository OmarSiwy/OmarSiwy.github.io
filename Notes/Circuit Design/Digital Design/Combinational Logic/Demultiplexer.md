---
title: Demultiplexer
description: "Routes one data bit to one of 2^n outputs: a decoder plus 2^n AND2s, one level deeper than the decoder it wraps."
kind: circuit
source: "0.2) Combinational Logic §Standard blocks, §Fan-in fan-out and logical effort, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, combinational-logic, decoder, routing, fpga]
aliases:
  - Demux
  - Demultiplexers
  - Demultiplexing
  - "1-to-2^n Demultiplexer"
---

# Demultiplexer

A demultiplexer steers one data bit onto exactly one of $2^n$ outputs and holds the other $2^n-1$ at zero, which makes it the only standard block whose output vector carries strictly less information than its input.

```tikz title="1-to-4 demultiplexer as a decoder plus an AND row, and the same table with the AND row folded into the decoder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  % ---------- (a) decoder + AND2 row ----------
  \node[anchor=west] at (-2.7,1.9) {\textbf{(a)} $1\!\to\!4$ demux $=$ decoder $+\;2^n$ AND2, depth $=$ decoder $+1$};

  \draw[fill=gray!8] (0,-4.3) rectangle (2.0,0.6);
  \node[align=center] at (1.0,-1.85) {$2\!\to\!4$\\ decoder\\ {\footnotesize one-hot}};

  \draw[->] (-2.7,-1.85) -- (0,-1.85);
  \draw (-1.5,-2.05) -- (-1.3,-1.65); \node[anchor=south] at (-1.4,-1.62) {2};
  \node[anchor=south] at (-2.7,-1.80) {$x[1:0]$};

  % D bus: in from the left, over the decoder, then down the tap column
  \draw[->] (-2.7,1.15) -- (2.55,1.15) -- (2.55,-4.15);
  \node[anchor=south] at (-2.7,1.20) {$D$ (1 bit)};

  \foreach \i/\y in {3/-3.65, 2/-2.45, 1/-1.25, 0/-0.05} {
    \node[and port, anchor=in 1] (A\i) at (3.3,\y) {};
    \draw (2.0,\y) -- (A\i.in 1);
    \node[anchor=south,font=\tiny] at (2.25,\y-0.02) {$m_{\i}$};
    \draw (A\i.in 2) -- ++(-0.75,0) coordinate (T\i);
    \fill (T\i) circle (1.4pt);
    \draw[->] (A\i.out) -- ++(0.9,0) node[anchor=west] {$Y_{\i}$};
  }
  \node[anchor=north,align=center] at (1.6,-4.6) {$Y_i = D\cdot m_i$, \; $m_i=\prod_j x_j^{(i_j)}$};

  % ---------- (b) folded form ----------
  \node[anchor=west] at (6.4,1.9) {\textbf{(b)} the AND row folded into the decoder};

  \draw[fill=gray!8] (8.2,-3.1) rectangle (10.6,-0.4);
  \node[align=center] at (9.4,-1.75) {$2\!\to\!4$ decoder\\ with \textsc{enable}};

  \draw[->] (6.2,-1.1) -- (8.2,-1.1); \node[anchor=south] at (6.2,-1.05) {$D$};
  \node[anchor=west,font=\tiny] at (8.25,-0.88) {EN};
  \draw[->] (6.2,-2.4) -- (8.2,-2.4);
  \draw (7.2,-2.6) -- (7.4,-2.2); \node[anchor=south] at (7.3,-2.17) {2};
  \node[anchor=south] at (6.2,-2.35) {$x[1:0]$};

  \draw[->] (10.6,-1.75) -- (12.4,-1.75);
  \draw (11.4,-1.95) -- (11.6,-1.55); \node[anchor=south] at (11.5,-1.52) {4};
  \node[anchor=west] at (12.4,-1.75) {$Y[3:0]$};

  \node[align=center,anchor=north,font=\footnotesize] at (9.4,-3.5)
    {AND$n\;\to\;$AND$(n{+}1)$ in the last level:\\ the $2^n$ AND2 and one whole\\ gate level disappear};
\end{circuitikz}
\end{document}
```

**Write the specification before the structure, because the structure is then forced.** Inputs: a data bit $D$ ($1$ bit) and a select word $x\in\{0,1\}^n$ ($n$ bits). Output: $Y\in\{0,1\}^{2^n}$ ($2^n$ bits), defined by

$$Y_i = D\cdot[\,x=i\,] = D\cdot\prod_{j=0}^{n-1} x_j^{(i_j)},\qquad i=0,\ldots,2^n-1$$

writing $x_j^{(1)}=x_j$ and $x_j^{(0)}=\overline{x_j}$, so $m_i=\prod_j x_j^{(i_j)}$ is the $i$-th **minterm** of the select word. Exactly one minterm is true for any $x$ — that is the definition of a minterm, not a property to be arranged — so $\sum_i Y_i = D$ over the integers and the output is either all-zero or one-hot. Two immediate consequences: the block is total in the sense of the [[Combinational Logic|combinational contract]], since every one of the $2^{n+1}$ input patterns names a definite output word; and it is far from surjective, because $2^{n+1}$ input patterns land on only $2^n+1$ reachable words out of $2^{2^n}$. The unreachable words are exactly the non-one-hot non-zero ones, which is why a [[Binary Encoder]] can invert this map and why feeding it anything else is meaningless.

**The cost line is decoder plus one AND row, and it is a direct transcription of the formula.** $m_i$ is what a [[Binary Decoder]] computes — $2^n$ AND$n$ gates and $n$ inverters — and the leading $D\cdot{}$ is one AND2 per output. Hence the table entry: **decoder $+\;2^n$ AND2, depth decoder $+1$**. All wires here are $1$ bit; only the aggregate $Y$ is $2^n$ bits wide. This is panel (a), and it is the honest way to *price* the block, because it separates a cost you may already be paying (a decoder is often in the design anyway, driving something else) from the incremental cost of the routing function.

**Associativity says you never have to build that AND row.** AND is associative, so

$$D\cdot\Bigl(\prod_j x_j^{(i_j)}\Bigr) \;=\; \prod\bigl(D,\,x_0^{(i_0)},\ldots,x_{n-1}^{(i_{n-1})}\bigr)$$

and the extra AND2 collapses into the decoder's own final gate: every AND$n$ becomes an AND$(n+1)$, the $2^n$ AND2s vanish and so does a whole gate level. That is panel (b), and it is the standard identity **a demultiplexer is a decoder with an active-high enable, with the data driven onto the enable**. Every discrete decoder part ships with that enable pin for exactly this reason. The transformation is free in gate count and strictly better in depth — but it is not free in *effort*.

**Price the fold with logical effort, not with levels.** For a static CMOS AND$n$ (NAND$n$ + inverter) the two stages compose to a [[Combinational Logic|logical effort]] $G=g_\text{NAND}g_\text{INV}=\tfrac{n+2}{3}$ and a parasitic delay $P=p_\text{NAND}+p_\text{INV}=n+1$; both grow **linearly** in $n$, so widening the final gate from $n$ to $n+1$ inputs costs $\tfrac13$ in $G$ and $1$ in $P$, while the deleted AND2 would have cost $G=\tfrac43$ and $P=3$ — plus a stage, which the $D_{\min}=NF^{1/N}+P$ form charges for separately. The fold wins comfortably at $n\le3$ and stops winning around $n=4$–$5$, which is the same crossover that makes wide decoders unbuildable in the first place. Past that point you are not choosing between panels (a) and (b) at all — you are predecoding ([[Predecoder]]): split $x$ into halves, build two $\tfrac n2$-decoders, and AND the partial minterms pairwise. $D$ then enters as one more input to a single AND-pair level, or as an enable on one of the half-decoders, and the whole question of "where does the data AND go" becomes "which predecode group absorbs it".

**A $w$-bit demux is $w$ copies of the AND row over one shared decoder.** Widen the data path from $1$ bit to $w$ and the select logic does not change: $Y_i \in \{0,1\}^w$ with $Y_i = D \cdot m_i$ bitwise, giving $w\,2^n$ AND2 gates and one decoder, with $D$ fanning out to $2^n$ gates and each $m_i$ fanning out to $w$. The decoder amortises across $w$ and stops mattering; what does matter is the branching effort $b$ on the $D$ path, which the delay model composes multiplicatively into $F=GBH$ — a $32$-bit demux to $16$ destinations puts a fan-out of $16$ on every data bit and needs a buffer tree, which is usually the dominant cost of the whole block and never appears in a gate count.

**The tree form trades gates for narrow gates and low switching activity.** Cascading $n$ levels of $1\!\to\!2$ demuxes — each one gate pair steered by a single select bit — gives $2+4+\cdots+2^n = 2^{n+1}-2$ AND2 gates in depth $n$, roughly twice the gate count of the folded form but with **nothing wider than two inputs at any node**, mirroring exactly the argument that makes the [[Multiplexer Tree]] the scalable mux. The tree has one property the flat form does not: $D$ is gated at the *first* level, so a data transition propagates down exactly one root-to-leaf path and $2^n-1$ output subtrees see no activity at all. In the flat form $D$ toggles the input of all $2^n$ AND gates and only the $m_i=0$ inputs stop it — the switching happens on the wire, which is where the capacitance is. On an ASIC data bus with high activity that difference dominates the gate-count difference.

> [!important] A demux output is usually an enable, and an enable must not glitch
> The decoder is a two-level AND-OR realisation of a function of $n$ variables, and nothing about it is hazard-free ([[Logic Hazards]]): when $x$ changes by more than one bit, the inverters and the AND gates arrive skewed, and two minterms can be momentarily true — so two outputs can momentarily be asserted, or the intended one can drop out and return. If $Y$ feeds a data bus into registers that have their own clean write-enable, this is invisible: the glitch settles inside $t_{pd}$ and the register samples the final value. If $Y$ *is* the write-enable, chip-select, set/reset or one-hot state vector, a glitch is a spurious write to the wrong destination — a functional failure that no amount of timing margin removes, because it is a hazard, not a delay. The fixes, in order of preference: register the select word so it changes atomically at a clock edge and gate the outputs with a qualifier that is stable across the transition; drive $D$ (the enable) low during the select transition, which forces all $Y_i=0$ by the formula and is why the enable exists; or synthesise the decoder as a [[Hazard-Free Two-Level Cover]] with the consensus terms included, which is only possible because the cover is two-level.

**On an FPGA the two panels are the same circuit, and often neither is needed.** Output $Y_i$ is a function of the $n+1$ variables $\{D,x_0,\ldots,x_{n-1}\}$, so for $n\le5$ every output fits **one LUT6 exactly**: a $1\!\to\!32$ demux is $32$ LUTs at depth $1$, the AND row is inside the truth table, and arguing about AND$n$ versus AND$(n+1)$ is arguing about a netlist the mapper deleted — the same collapse the long-form note documents for the $4\!:\!1$ mux ([[Lookup-Tables]], [[FPGAs]]). Above $n=5$ you pay one more LUT level per additional $5$ select bits, and note that the `MUXF7`/`MUXF8` hard multiplexers do **not** help here: they collapse wide *multiplexers*, and a demux has no reduction stage for them to sit in. The larger point is architectural: on an FPGA the destinations are almost always registers or block RAMs that already have a clock-enable or write-enable port, so the right structure is a decoder driving those enables directly with the data broadcast as a shared bus — the demux's AND row is $w\,2^n$ LUTs spent to reproduce an enable the fabric gives away.

$$\boxed{\ Y_i = D\cdot\prod_{j} x_j^{(i_j)},\quad \textstyle\sum_i Y_i = D,\quad C = C_{\text{dec}}(n) + w\,2^n\ \text{AND2},\quad d = d_{\text{dec}}(n)+1\ }$$

**When it breaks**

- **The output word is a routing statement, not a number.** $Y$ is one-hot-or-zero; adding, comparing or accumulating it is a category error. Only a [[Binary Encoder]] (which assumes one-hot) or a [[Priority Encoder]] (which does not) turns it back into an index.
- **$D=0$ and "no output selected" are indistinguishable.** $Y=0$ means either the data bit was zero or the block was disabled. If the destination needs to know that a transfer happened, a demux alone cannot tell it — you need a separate valid line, which in practice means demultiplexing the valid signal too and using $Y_i^{\text{valid}}$ as the enable.
- **Wide fan-out, not gate count, sets the delay.** Past $w\,2^n \approx$ a few dozen loads, the $D$ buffer tree is the critical path and the gate-level cost model above is describing the wrong circuit.
- **Select glitches are fatal whenever outputs are enables** — see the callout. This is the failure mode that actually ships, and it survives every static timing sign-off.
- **Around $n=4$ the flat decoder stops being buildable** and the block becomes a [[Predecoder]] question; on an FPGA the whole comparison dissolves at $n=5$ instead, at the LUT boundary.
- **When the destinations already have enables**, the demux is redundant hardware. Broadcast the data and decode only the enables — the register file, the memory-mapped write port and the one-hot FSM output are all this pattern.

**RTL (Spade)**

```spade
/// n -> 2^n one-hot binary decoder with an enable.
/// Recursion on the MSB: each select bit doubles the line count and
/// distributes the enable, so `en` is ANDed in for free at every level.
fn decode<#uint N, #uint M>(en: bool, sel: [bool; N]) -> [bool; M] {
    gen if N == 0 {
        [en]
    } else {
        let s = sel[N-1..N][0];
        decode::<{N-1}, {M/2}>(en && !s, sel[0..N-1])
            .concat(decode::<{N-1}, {M/2}>(en && s, sel[0..N-1]))
    }
}

/// 1 -> 2^n demultiplexer: the decoder's enable input *is* the data input.
fn demux<#uint N, #uint M>(d: bool, sel: [bool; N]) -> [bool; M] {
    decode::<N, M>(d, sel)
}
```

`demux` is panel (b) verbatim — there is no AND row in the source text because the associativity argument above deleted it, and `en` threading down the recursion is the $D$ bus of panel (a) after the fold. `M` is a second generic rather than $2^N$ because Spade's type expressions admit `+ - * /` but no exponentiation (`Operator ** is not supported in a type expression`), so the doubling is expressed backwards as `M/2` per level and the solver ties $M=2^N$ at the call site; a concrete `demux8(d: bool, sel: uint<3>) -> uint<8>` wrapper is what monomorphises it. Element $0$ of a Spade array is the **LSB** and `x.concat(y)` puts `x` low, so recursing on the MSB with the $\overline{s}$ half first is what makes $Y_i$ land at bit $i$ — swap the two `concat` operands and the block still compiles, still routes one bit to one output, and routes it to $2^n-1-i$. Everything is `fn`, so it is purely combinational with no clock; synthesis will flatten the recursion completely, and an FPGA mapper will re-derive the one-LUT-per-output form regardless of how the tree is written.

**Related Notes**

- [[Binary Decoder]] – depends-on: computes the $m_i$ this block masks with $D$; the demux is that note's circuit with its enable pin driven by data.
- [[Predecoder]] – extends: what the decoder inside becomes once $n>4$ makes the flat AND$n$ unbuildable.
- [[Multiplexer Tree]] – compares: the inverse routing direction, $2^n\!\to\!1$; the same one-hot vector consumed rather than produced, and the same "no gate wider than two" scaling argument.
- [[One-Hot Multiplexer]] – compares: the mux built from this note's decoder, showing the two blocks share their entire select path and differ only in the reduction stage.
- [[Binary Encoder]] – counter-example: the partial inverse, defined only on the one-hot outputs this block produces.
- [[Priority Encoder]] – supports: recovers an index when the vector is *not* guaranteed one-hot, e.g. after a glitch or from several demuxes ORed together.
- [[Logic Hazards]] – depends-on: why the select transition can momentarily assert two outputs.
- [[Hazard-Free Two-Level Cover]] – supports: the consensus-term construction that removes the glitch when the outputs are enables.
- [[Choosing a Combinational Block]] – compares: where the demux sits against every sibling standard block, by target and by $n$.
- [[Lookup-Tables]] – counter-example: at $n\le5$ every output is one LUT and the decoder/AND-row distinction stops existing.

## References

- [[0.2) Combinational Logic]] — §Standard blocks (the demux cost line $Y_i=D\cdot(x=i)$, decoder $+\,2^n$ AND2, depth decoder $+1$; decoders and predecoding), §Fan-in, fan-out and logical effort ($g$, $p$ and the $n\approx4$ crossover; $F=GBH$ and branching effort), §Glitches and hazards, §FPGA mapping (the LUT6 boundary and the `MUXF7`/`MUXF8` discussion), §Trade-offs.
- Standard blocks, the decoder-with-enable identity and demultiplexer trees — Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Logical effort of wide AND/NAND gates and the fan-in penalty — Weste & Harris, *CMOS VLSI Design*, ch. 4.
