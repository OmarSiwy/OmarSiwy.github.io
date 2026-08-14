---
title: Binary Decoder
description: "Turns an n-bit code into one-hot 2^n select lines in a single AND level; costs n*2^n gate inputs and n-input ANDs that stop being buildable past n=4."
kind: circuit
source: "No book source — digital-design canon: Mano & Ciletti ch. 4; Wakerly ch. 6; Weste & Harris chs. 4, 12"
status: seed
spade: simulated
tags: [digital, combinational-logic, decoder, one-hot, fpga]
aliases:
  - Decoder
  - Decoders
  - Binary Decoders
  - One-Hot Decoder
  - Address Decoder
  - 3-to-8 Decoder
---

# Binary Decoder

A decoder is the physical realisation of the minterm expansion: it takes an $n$-bit binary code and asserts exactly one of $2^n$ output lines, which is the one property — one-hotness — that every block downstream of it relies on.

```tikz title="3-to-8 binary decoder drawn as a minterm AND array"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- input bus + the three inverters that produce the complements ----
  \draw[->] (-3.3,1.5) -- (-1.7,1.5);
  \draw (-2.6,1.35) -- (-2.4,1.65);
  \node[anchor=south, font=\footnotesize] at (-2.5,1.62) {3};
  \node[anchor=south] at (-3.3,1.55) {$x[2:0]$};
  \draw (-1.7,1.15) rectangle (5.1,1.85);
  \node at (1.7,1.5) {3 inverters $\Rightarrow$ 6 rails};

  % ---- six vertical rails: x_j and its complement ----
  \foreach \r/\lbl in {0/{$x_0$}, 1/{$\overline{x_0}$}, 2/{$x_1$}, 3/{$\overline{x_1}$},
                       4/{$x_2$}, 5/{$\overline{x_2}$}} {
    \draw[black!70] ({\r*0.95},1.15) -- ({\r*0.95},-4.05);
    \node[anchor=south west, font=\footnotesize] at ({\r*0.95+0.06},0.72) {\lbl};
  }

  % ---- eight word lines, one per minterm; a dot = one AND input ----
  \foreach \i/\a/\b/\c/\code in {0/0.95/2.85/4.75/000, 1/0.00/2.85/4.75/001,
                                 2/0.95/1.90/4.75/010, 3/0.00/1.90/4.75/011,
                                 4/0.95/2.85/3.80/100, 5/0.00/2.85/3.80/101,
                                 6/0.95/1.90/3.80/110, 7/0.00/1.90/3.80/111} {
    \draw (-0.5,{-0.45-\i*0.45}) -- (5.2,{-0.45-\i*0.45});
    \foreach \p in {\a,\b,\c} { \fill (\p,{-0.45-\i*0.45}) circle (2.2pt); }
    \node[anchor=east, font=\tiny, text=black!60] at (-0.6,{-0.45-\i*0.45}) {\code};
    \draw (5.2,{-0.68-\i*0.45}) rectangle (6.3,{-0.22-\i*0.45});
    \node[font=\tiny] at (5.75,{-0.45-\i*0.45}) {AND3};
    \draw[->] (6.3,{-0.45-\i*0.45}) -- (7.1,{-0.45-\i*0.45});
    \node[anchor=west, font=\footnotesize] at (7.15,{-0.45-\i*0.45}) {$Y_{\i}$};
  }

  % ---- output bus ----
  \draw[black!55] (7.95,-0.30) -- (7.95,-3.60);
  \draw[->,black!55] (7.95,-1.95) -- (8.7,-1.95);
  \node[anchor=west, font=\footnotesize, text=black!55] at (8.75,-1.95)
    {$Y[7:0]$, one-hot};

  % ---- the worked vector x = 101 ----
  \draw[very thick] (-0.5,-2.70) -- (5.2,-2.70);

  % ---- the cost, read straight off the drawing ----
  \node[anchor=north west, align=left, font=\footnotesize] at (-3.3,-4.35)
    {$8$ rows $\times\;3$ dots $=24$ gate inputs $=n2^n$; depth is one AND$n$ level.\\
     Every rail drives $2^{n-1}=4$ gates, so fan-out grows as $2^{n-1}$ too.\\
     Bold row: $x=101$ hits all three of its taps, so $Y_5=1$ and every other
     row misses at least one rail.};
\end{circuitikz}
\end{document}
```

*Input $x[2:0]$ is 3 bits, output $Y[7:0]$ is 8 bits, each rail and word line 1 bit. Every dot is one input of one AND gate, so the dot count is the gate-input count. My own construction.*

**Read the circuit straight off the minterm definition.** Write $x_j^{(1)} = x_j$ and $x_j^{(0)} = \overline{x_j}$ for the literal of bit $j$ in polarity $b$. The $i$-th minterm of an $n$-variable function is

$$m_i(x) \;=\; \bigwedge_{j=0}^{n-1} x_j^{(i_j)}, \qquad i_j = \text{bit } j \text{ of } i,$$

and a decoder is nothing but all $2^n$ of them computed in parallel: $Y_i = m_i(x)$, with $x$ $n$ bits wide and $Y$ $2^n$ bits wide. One-hotness is not a design choice, it is a theorem about minterms — they are **complete** ($\bigvee_i m_i = 1$, since every $x$ matches its own index) and **pairwise disjoint** ($m_i \wedge m_k = 0$ for $i \neq k$, because the two indices differ in some bit $j$ and the products then contain both $x_j$ and $\overline{x_j}$, whose AND is $0$ by complementation). Exactly one output is high for every input, always.

**Price the flat form and the fan-in stops you at $n \approx 4$.** The drawing is $2^n$ AND gates of $n$ inputs plus $n$ inverters: $n2^n$ gate inputs and a single AND level. The unit-gate model says "depth 1, done" — and that model is wrong here in the way [[Logical Effort]] makes precise. A static-CMOS AND$n$ is a NAND$n$ followed by an inverter, so on the path through it

$$G = g_{\text{NAND}n}\,g_{\text{INV}} = \tfrac{n+2}{3}, \qquad P = p_{\text{NAND}n} + p_{\text{INV}} = n + 1.$$

Both terms are **linear in $n$**, so widening the gate is paid for twice — once in drive strength, once in self-loading. Past $n \approx 4$ a tree of narrow gates beats the flat array even though the tree is deeper, and the tree that a decoder wants is the pairwise factoring in [[Predecoder]], which drops every gate to an AND2 and the input count from $n2^n$ to $O(2^n)$.

**Fan-out is the cost the schematic hides.** Each of the $2n$ rails feeds exactly half the rows — bit $j$ appears in true polarity in the $2^{n-1}$ minterms whose $j$-th index bit is 1 — so the electrical effort $h = C_{\text{out}}/C_{\text{in}}$ on every rail grows as $2^{n-1}$. For an SRAM row decoder ($n = 8$ to $10$) that is a load of 128 to 512 gate inputs on a single wire, and no amount of gate-level cleverness fixes it: you insert a buffer chain sized for $\hat f \approx 4$ per stage, which is where the decoder's real delay lives. This is the same fan-out that makes [[Block Memory]] worth using instead of building the array yourself.

> [!warning] Not covered in the source — needs outside research
> The stage count and transistor sizing of the driver chain in a real SRAM row decoder, and the process-specific $n$ at which predecoding overtakes the flat array, are not in the long-form note. Weste & Harris ch. 12 has both.

**Enable distributes into the array, and it is what makes a demultiplexer.** Adding a global enable gives $Y_i = \mathrm{En} \wedge m_i(x)$. By associativity of AND you can either widen every gate to AND$(n{+}1)$ — one more dot per row, $2^n$ extra gate inputs, no extra depth — or AND the enable into the outputs afterwards, which costs $2^n$ AND2 and one extra level but leaves the array untouched. Feed the enable pin with data rather than a constant and the same hardware is a [[Demultiplexer]]: routing $D$ to line $x$ is exactly $Y_i = D \wedge m_i(x)$. The two blocks are the *same circuit* with the enable relabelled, which is why the gate count for a demux is "decoder plus $2^n$ AND2" and not something new.

> [!important] With $\mathrm{En} = 0$ the output is all-zero, which is **not** one-hot. Anything downstream that assumes exactly one hot bit — a [[One-Hot Multiplexer]] reading $\bigvee_i Y_i D_i$, a one-hot state register, a wired-OR memory row — sees zero, not a valid selection. Decide deliberately whether all-zero is a legal state of your protocol; it is the one input that silently breaks the invariant the whole one-hot style rests on.

**A decoder is the front half of every select-driven block, so you rarely instantiate one alone.** The one-hot multiplexer is a decoder feeding a wide AND-OR. A ROM is a decoder driving a wired-OR of programmed word lines — which is precisely a [[Lookup-Tables|LUT]] with its contents fixed at fabrication rather than at configuration. A register file's write-port decode, a memory-map address decode and a one-hot FSM's next-state logic are all this array with different loads hung off it. Recognising the shape matters more than instantiating it, because synthesis will build it for you the moment you write an indexed select.

**Active-low is the historical default and it is not an accident.** Static CMOS has no AND gate; it has a NAND. Dropping the output inverters gives $\overline{Y_i}$ — a **one-cold** code, $2^n - 1$ ones and a single zero — for $2^n$ fewer transistors and one less gate delay. That is why the 74x138 and essentially every memory row decoder present active-low outputs: the inverter was deleted, and the convention was written around the cheaper circuit rather than the tidier truth table. Invert at the consumer if the consumer wants it, since one inverter there beats $2^n$ here.

**On an FPGA the array disappears below the LUT boundary.** A $3\to8$ decoder is eight independent functions of the same three variables, so it maps to eight LUT3s — and since a LUT6 is fracturable into two LUT5s sharing inputs, those eight cost at most four LUT6s and quite possibly fewer after packing. Generally an $n\to2^n$ decoder with $n \le 6$ is $2^n$ LUTs of depth 1, and the fan-in argument that dominates the ASIC analysis is simply absent: a LUT6 costs the same whether it computes a 2-input or a 6-input function. Above $n = 6$ you pay one extra LUT level per five additional address bits, and at that point the honest answer is that you wanted [[Block Memory]], whose row and column decoders are hard silicon you get for free.

$$\boxed{\ Y_i = \mathrm{En}\wedge\bigwedge_{j=0}^{n-1} x_j^{(i_j)}\;;\qquad n2^n \text{ gate inputs},\ \ \text{depth } 1\ \text{AND}n,\ \ \text{fan-out } 2^{n-1}\text{ per rail}\ }$$

**When it breaks.**

- **$n > 4$.** The AND$n$ is no longer the fastest way to build the product; predecode. Above $n \approx 8$ the rail fan-out, not the gate, is the critical path.
- **$n$ large, full stop.** The output is $2^n$ physical wires. An $8\to256$ decoder is 256 nets to route; past that the encoded form is the representation you want and the decode should happen at the point of use.
- **During input transitions there is no one-hot invariant.** The decoder is a two-level AND array with no consensus terms, and when several input bits switch at once the rails arrive skewed, so the array transiently passes through *other* minterms. A $011 \to 100$ transition can momentarily assert $Y_0$, $Y_1$ or $Y_2$ depending on rail skew. If the outputs are write enables or clock gates, that glitch is a spurious write — gate them with a clock or a stable enable rather than trusting the drawing. See [[Logic Hazards]].
- **Enable low.** All-zero output, one-hotness gone; see the callout above.
- **The input is not a dense code.** If only $k \ll 2^n$ of the codes ever occur, $2^n - k$ gates are dead area. Decode the sparse case with a comparator per live code, not with a full array.

```spade
/// n -> 2^n binary decoder. M must be at least N; for a full decoder M = 2^N.
/// Output is one-hot when en is true, all-zero when it is false.
fn decode<#uint N, #uint M>(x: uint<N>, en: bool) -> uint<M>
    where M >= N else "decoder output must be at least as wide as its input"
{
    let one: uint<M> = 1;
    let sel: uint<M> = zext(x);
    if en { one << sel } else { 0 }
}

entity dec3to8(x: uint<3>, en: bool) -> uint<8> {
    decode::<3, 8>(x, en)
}
```

`x` is the input bus at the left of the drawing, `en` the global enable, and the returned `uint<8>` is the $Y[7:0]$ column of AND outputs — bit $i$ of the result is word line $Y_i$, with bit 0 the LSB and therefore the top row. Purely combinational: `fn` cannot contain a `reg`, which is the type system enforcing that a decoder has no state. The width rule is the `where M >= N` clause plus the `zext` on the shift amount — Spade requires both sides of `<<` to have the same type, so the 3-bit index is widened to 8 before shifting, and the shift never overflows because $x \le 2^N - 1 = M - 1$. Synthesis will not build a barrel shifter from `1 << x`: every output bit's cone is a function of only the $N$ address bits, so the mapper recovers the AND array (or, on an FPGA, $2^N$ LUTs) that the diagram shows.

**Related notes.**

- [[Predecoder]] – extends: factors this single AND$n$ level into two half-width decoders plus a plane of AND2s, which is how the fan-in penalty above is actually paid off.
- [[Demultiplexer]] – extends: the same array with the enable pin driven by data instead of a constant.
- [[One-Hot Multiplexer]] – depends-on: consumes this note's output directly, and is the block that breaks when the one-hot invariant does.
- [[Lookup-Tables]] – compares: a LUT is this decoder wired to a column of configuration bits, with the fan-in argument replaced by a flat cost per 6-input function.
- [[Block Memory]] – supports: the case where the decoder and its buffer chain are hard silicon rather than something you build from gates.
- [[Logical Effort]] – supports: supplies the $g$ and $p$ values that turn "depth 1" into the real delay.
- [[Logic Hazards]] – counter-example: the one-hot property is a statement about steady state only; the transient behaviour of this exact array is the standard example.

## References

Established digital-design canon; this note has no assigned book source.

- Minterms, decoders, demultiplexers, enable inputs, the 74x138 active-low convention — Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Logical effort of NAND$n$, the fan-in penalty and $\hat f \approx 4$ buffer chains — Weste & Harris, *CMOS VLSI Design*, ch. 4; SRAM row decoders and predecoding, ch. 12.
- Standard-block cost table, the predecoding argument and the fan-in threshold at $n \approx 4$ — sections "Standard blocks" and "Fan-in, fan-out and logical effort" of the long-form Combinational Logic note.
