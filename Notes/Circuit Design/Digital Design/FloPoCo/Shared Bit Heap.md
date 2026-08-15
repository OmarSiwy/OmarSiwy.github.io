---
title: Shared Bit Heap
description: "Several multipliers throw bits onto one common heap and do no local compression, so a sum of products costs exactly one compressor tree — the multipliers stop being VHDL entities at all."
kind: circuit
source: "ASA §A.3.4, pp. 775-777"
status: seed
spade: simulated
tags: [digital, flopoco, bitheap, compression, sopc]
aliases:
  - Shared Bit Heaps
  - BitHeap Framework
  - Sum of Products by Constants
  - SOPC
---

# Shared Bit Heap

One sum-of-weighted-bits accumulator into which several operators write their partial products directly, so the whole sum of products is compressed once instead of once per multiplier — and the price is that the contributing multipliers cease to be entities.

```tikz title="One bit heap shared by three constant multipliers: columns by weight, bits within a column sorted by arrival time"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,every node/.style={font=\footnotesize},>=stealth]
  % ---------- the three contributing "operators" ----------
  \foreach \y/\txt in {%
      2.15/{\texttt{IntConstMult} $c_0$ --- \textbf{filled dots}\\ \texttt{addSignal("P0", 0)}\\ $P_0$: 8\,b, arrives first},
      0.70/{\texttt{IntConstMult} $c_1$ --- \textbf{open dots}\\ \texttt{subtractSignal("P1", 1)}\\ $P_1$: 8\,b},
      -0.75/{\texttt{IntConstMult} $c_2$ --- \textbf{squares}\\ \texttt{addSignal("P2", 2)}\\ $P_2$: 8\,b, arrives last}}{
    \draw[dashed] (-9.9,\y-0.62) rectangle (-6.4,\y+0.62);
    \node[align=left,anchor=west,font=\tiny] at (-9.8,\y) {\txt};
    \draw[->] (-6.4,\y) -- (-6.0,\y) -- (-6.0,0.70) -- (-3.1,0.70);
  }
  \node[anchor=south,font=\tiny] at (-4.5,0.80) {no local compression};
  % ---------- the heap: column c at x = 2.5-0.5c, gravity-packed ----------
  % P0: filled dots, columns 0..7, bottom row
  \foreach \c in {0,...,7} \fill (2.5-0.5*\c,0.34) circle (2.6pt);
  % P1: open dots, columns 1..8, plus its sign extension in column 9
  \foreach \c in {1,...,7} \draw[fill=white] (2.5-0.5*\c,0.68) circle (2.6pt);
  \draw[fill=white] (-1.5,0.34) circle (2.6pt);
  \draw[fill=white] (-2.0,0.34) circle (2.6pt);
  % P2: filled squares, columns 2..9
  \foreach \c in {2,...,7} \fill (2.425-0.5*\c,0.87) rectangle (2.575-0.5*\c,1.02);
  \fill (-1.575,0.605) rectangle (-1.425,0.755);
  \fill (-2.075,0.605) rectangle (-1.925,0.755);
  % the rounding constant
  \node[font=\tiny] at (2.5,0.68) {$\mathbf{1}$};
  % column axis
  \foreach \c in {0,...,9} \node[anchor=north,font=\tiny] at (2.5-0.5*\c,0.13) {\c};
  \node[anchor=north,font=\tiny] at (-2.0,-0.22) {$m_P$};
  \node[anchor=north,font=\tiny] at (2.5,-0.22) {$\ell_P$};
  % ---------- annotations, all below the heap ----------
  \node[anchor=east,font=\tiny,align=right] at (-2.75,-0.56)
    {automatic sign extension\\ of the subtracted $P_1$};
  \draw[->,thin] (-2.70,-0.48) -- (-2.42,0.08) -- (-2.26,0.30);
  \node[anchor=west,font=\tiny] at (2.98,-0.86) {\texttt{addConstantOneBit(0)}, the rounding constant};
  \draw[->,thin] (3.00,-0.78) -- (2.68,0.56);
  \node[anchor=north,font=\tiny,align=center] at (0.25,-1.12)
    {column $=$ weight $2^{c}$, 10 columns; within a column,\\
     bits are sorted by arrival time $(c,\tau)$, earliest at the bottom};
  % ---------- compression ----------
  \draw (4.4,0.15) rectangle (8.6,1.25);
  \node[align=center,font=\tiny] at (6.5,0.70) {\texttt{startCompression()}\\ compressor tree $+$ final adder};
  \draw[->] (3.2,0.70) -- (4.4,0.70);
  \node[anchor=south,font=\tiny] at (3.8,0.76) {one call};
  \draw[->] (8.6,0.70) -- (9.7,0.70);
  \node[anchor=south,font=\tiny] at (9.15,0.76) {10\,b};
  \node[anchor=west] at (9.75,0.70) {$R$};
  \node[anchor=north,font=\tiny,align=center] at (6.5,0.05)
    {compressors are target-dependent;\\ the sorted columns let the earliest bits compress first};
\end{circuitikz}
\end{document}
```

*Own construction, from the interface of Table A.1 and the data structure of p. 776; the dot convention is that of Fig. 7.18, p. 173.*

**Read the sum of products as one sum of bits, not as $n$ products that are then added.** For a sum of products by constants (SOPC),

$$R \;=\; \sum_{j=1}^{n} c_j\,x_j,$$

each $c_j x_j$ is itself realised as a few shifted copies of $x_j$ — the adder graph of [[Multiple Constant Multiplication]]. Substituting those shifted copies and applying associativity and commutativity of addition, the whole expression flattens into a single weighted sum of one-bit terms:

$$R \;=\; \sum_{i=\ell_P}^{m_P} 2^{i}\!\!\sum_{b \in \mathrm{col}_i}\!\! b .$$

Nothing in that identity distinguishes bits that came from $x_1$ from bits that came from $x_2$. The $n$-product structure is an artefact of how the expression was written down, and any grouping that respects it is a self-imposed constraint. Sharing the heap is simply the refusal to impose it.

**Grouping does not change the number of full adders, so that is not what sharing buys.** A 3:2 compressor consumes three bits of column $i$ and returns one bit to column $i$ and one to column $i+1$: net change $-1$ bit. A 2:2 (half adder) consumes two and returns two: net change $0$; it moves a bit up a column without removing it. Therefore reducing a heap of $B$ bits over $w$ columns to a two-row heap — the input a carry-propagate adder wants — costs

$$\#\mathrm{FA} \;=\; B - (\text{bits left}) \;\ge\; B - 2w,$$

with equality when every column ends holding exactly two bits. The count depends on $B$ and $w$ only, **not** on the order or the grouping of the compressions. In the diagram: $B = 8 + 9 + 8 + 1 = 26$ bits (the nine including the one sign-extension bit of $P_1$, the one being the rounding constant) over $w = 10$ columns, so 6 full adders reach two rows, however you schedule them.

**What sharing removes is carry propagation.** If each multiplier compresses its own heap it must finish the job: emit a carry-propagate adder to resolve its two rows into one non-redundant $w_j$-bit product. The enclosing sum then has $n$ rows to compress and needs a carry-propagate adder of its own. That is $n+1$ carry propagations, and two tree depths, where the shared heap has exactly one of each. Carry propagation is the part whose delay is $\Theta(\log w)$ rather than $\Theta(1)$ — see [[Adders]] — so the saving is concentrated where the critical path is, not where the area is.

**Sharing also merges the constants.** Every subtracted contributor owes the heap a two's-complement $+1$ by the identity $-x = \bar{x} + 1$ (see [[Number Formats]]), and every truncation owes a rounding constant (see [[Rounding]]). Held locally, each of those is a separate carry-in on a separate adder. Thrown on one heap they are ordinary weighted bits at known positions, and `addConstant(cst, pos)` lets the generator fold all of them into a single constant added once. The same applies to sign extension: because a bit's argument is a FloPoCo `Signal` carrying signedness, MSB and LSB, `addSignal` and `subtractSignal` sign-extend automatically (p. 776) — the bookkeeping that makes hand-written bit-heap code error-prone is done by the object that already knows the format.

**Each weighted bit carries its arrival time, which makes the heap a scheduling structure as well as an adder.** A weighted bit is a signal name, a bit position, and — because `Signal` encapsulates timing — the lexicographic circuit time $(c,\tau)$ of [[Frequency-Directed Pipelining]]. A column is a list sorted by arrival time, so the compression algorithm compresses the earliest-arrived bits first (p. 776). This matters most precisely when the heap is shared: contributors that come from different multipliers have genuinely different arrival times, and a local grouping would have forced the early ones to wait for their own multiplier's slow bits rather than for the bits they will actually be compressed with.

> [!important] A port carries a resolved value, so sharing a heap means dissolving the entity
> An entity boundary can only pass a non-redundant number. Handing a partially compressed heap across a port would mean inventing a port protocol for a redundant, ragged, timing-annotated structure — so in practice a module boundary *is* a mandatory local compression. FloPoCo's consequence is stated plainly on p. 775: for the SOPC case the constant multiplier "does not correspond to a VHDL entity"; it is a method that takes a pointer to another `Operator` and writes into *that* operator's `vhdl` stream. The design-hierarchy cost of the shared heap is not incidental, it is the mechanism.

**The interface is small because the ordering constraint is the whole discipline** (Table A.1, p. 776):

| Method | Effect |
|---|---|
| `addBit(sigName, pos)` | add a single bit at position `pos` |
| `addSignal(sigName, shift)` | add a fixed-point signal, sign-extending if needed |
| `subtractSignal(name, shift)` | subtract a fixed-point signal, sign-extending if needed |
| `addConstantOneBit(pos)` | add a constant one bit |
| `addConstant(cst, pos)` | add the constant $\texttt{cst}\cdot 2^{\texttt{pos}}$ |
| `startCompression()` | generate the compressor tree |

The `add*` calls emit **no** VHDL at all; they only register bits. `startCompression()` emits all of it (Listing A.3, p. 776), in five steps (p. 777): pick a `CompressionStrategy`; generate the list of possible, target-dependent compressors (`BasicCompressor` for the shape, `Compressor` for the hardware); schedule the bits into stages by cycle and combinatorial arrival time; optimise, producing a `BitHeapSolution` of compressors per stage and column; emit. So the shared heap is a rendezvous: every contributor must have run before that single call.

**On FPGA the shared heap is worth more than the carry-propagation count suggests, for a different reason.** A 10-bit carry-propagate adder on Xilinx or Intel fabric is a few cells of hard carry chain, so eliminating $n$ of them saves less than the ASIC arithmetic implies. The FPGA gain comes from step 2 instead: the compressor list is generated *per target*, and generalized LUT-based compressors — those taking more than three bits of a column — only pay off when a column is tall enough to feed them. Local compression keeps every column short by construction. Sharing is what makes the heap tall enough for the fabric's own compressors to be selectable at all; see [[Compressor Trees]] for which shapes exist.

$$\boxed{\;R=\sum_{j=1}^{n}c_j x_j=\!\!\sum_{i=\ell_P}^{m_P}\!\! 2^{i}\!\!\!\sum_{b\in\mathrm{col}_i}\!\!\! b
\quad\Longrightarrow\quad \#\mathrm{FA}=B-2w \ \text{(grouping-independent)},\quad \#\mathrm{CPA}: \ n{+}1 \to 1\;}$$

**When it breaks.**

- **A product that is needed elsewhere must be resolved anyway.** If $c_j x_j$ also feeds an output tap or a second sum, it needs its own carry-propagate adder, and sharing buys nothing for that contributor — it only adds a copy of its bits to the heap.
- **Disjoint weight ranges share nothing.** If the products do not overlap in column, the "sum" is a concatenation; $B - 2w$ is already $0$ and there is no compression to share.
- **The rendezvous serialises generation.** Nothing can be emitted until every contributor has thrown its bits, so a shared heap cannot be pipelined or retimed independently of its neighbours; the whole sum schedules as one.
- **Widely separated arrival times turn savings into registers.** Sorted columns let early bits compress first, but if one contributor is many cycles late, the compressed early bits must be held. Beyond some skew the shared heap costs pipeline registers instead of saving adders — where a locally compressed, separately retimed sub-adder would have been cheaper.
- **No entity means no unit test.** The dissolved constant multiplier has no ports, so the generated [[Self-Checking Test Bench]] can only exercise the enclosing operator. A sign-extension or shift error inside one contributor surfaces as a wrong sum, with $n$ suspects.

> [!warning] Not covered in the source — needs outside research
> Appendix A gives no cost comparison between a shared and a locally compressed heap: no LUT or slice counts, no achieved $f_{\max}$, no measured saving for the SOPC case it names as canonical. The $\#\mathrm{FA} = B - 2w$ argument above is derived from the compressor definition, not quoted; the appendix asserts only that an efficient implementation "requires" the shared heap (p. 775).

**RTL (Spade).** Spade has no bit-heap object, so what the RTL can show is the property that defines one: no contributor resolves its own product, and there is exactly one final addition. Here $R = 3x_0 + 5x_1 + 7x_2$ on three unsigned 8-bit inputs.

```spade
/// One shared bit heap for R = 3*x0 + 5*x1 + 7*x2.
/// Each "constant multiplier" only throws weighted bits; none of them adds up
/// its own product. There is exactly one compression, one carry-propagate add.
fn sopc3(x0: uint<8>, x1: uint<8>, x2: uint<8>) -> uint<12> {
    let a0: uint<12> = zext(x0);
    let a1: uint<12> = zext(x1);
    let a2: uint<12> = zext(x2);

    // c0 = 3 = 2 + 1   -> addSignal(x0,1), addSignal(x0,0)
    let t0 = a0 << 1;
    let t1 = a0;
    // c1 = 5 = 4 + 1   -> addSignal(x1,2), addSignal(x1,0)
    let t2 = a1 << 2;
    let t3 = a1;
    // c2 = 7 = 8 - 1   -> addSignal(x2,3), subtractSignal(x2,0):
    //                     the complement of x2 ...
    let t4 = a2 << 3;
    let t5 = ~a2;
    // ... and the one constant bit its two's complement owes the heap
    let k: uint<12> = 1;

    // one heap, one compression: no intermediate result is ever resolved
    ((t0 +. t1) +. (t2 +. t3)) +. ((t4 +. t5) +. k)
}
```

`t0`–`t5` and `k` are the seven rows of the heap, all `uint<12>`: the output range is $0 \le R \le 15\cdot255 = 3825 < 2^{12}$, so every row is zero-extended to the final $w = 12$ once, at the edge, and the additions are the wrapping `+.` throughout — the sole reason the truncating operator is correct here is that the true result is known to fit, which is the heap's $(m_P,\ell_P)$ bound doing its job. `t5` together with `k` is `subtractSignal(x2, 0)`: complement plus the one bit of $-x = \bar{x}+1$, and with several subtractions those constant bits would merge into a single `addConstant`. The block is purely combinational — no `reg`, no `inst` — which is why it is a `fn`.

The tree shape written here is *not* what synthesis builds. The parenthesisation is only Spade's syntax forcing a binary expression; the backend sees one seven-operand sum and is free to compress it as a heap, exactly as `startCompression()` would. What the code does guarantee is the property the note is about: no `t`$_j$ pair is ever truncated or resolved on its own before joining the others.

Compiled with `spade 0.19.0`, and simulated through `.zettel/sim.sh` against a behavioural $3x_0+5x_1+7x_2$: 10 named vectors including the asymmetric pair $(1,0,128)\mapsto 899$ and its mirror $(128,0,1)\mapsto 391$, plus 3000 random triples — 3010/3010 pass.

**Related Notes.**

- [[Bit Heaps]] – depends-on: the structure being shared; this note is the case where one heap outlives the operator that filled it.
- [[Compressor Trees]] – depends-on: `startCompression()` is the tree optimiser, and a shared heap is what gives it enough column height to choose from.
- [[Multiple Constant Multiplication]] – compares: MCM shares *subexpressions* between the constant multipliers, this shares their *bit heap*; the two savings are orthogonal and compose.
- [[LTI Filters]] – extends: an FIR tap sum is the canonical SOPC, so a filter is one heap for the whole tap bank.
- [[Frequency-Directed Pipelining]] – supports: supplies the arrival time $(c,\tau)$ that each weighted bit carries and that its column is sorted by.
- [[Self-Checking Test Bench]] – counter-example: it verifies entities, and the shared heap is precisely the construction that abolishes the contributors' entities.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- A.3.4 The BitHeap Framework, pp. 775-777 — orthogonality of bit heap and `Operator`, the SOPC sharing case and the pointer-to-`Operator` method (p. 775)
- A.3.4.1 Interface Overview and Table A.1, Listing A.3, p. 776
- A.3.4.2 The Data Structure, pp. 776-777 — weighted bit, arrival time, columns sorted by arrival time; dot diagrams as in Fig. 7.18, p. 173
- A.3.4.3 Compressor Tree Generation, p. 777 — the five steps of `startCompression()`
- Sect. 12.5.5, p. 412 — the SOPC architecture the sharing case is drawn from
