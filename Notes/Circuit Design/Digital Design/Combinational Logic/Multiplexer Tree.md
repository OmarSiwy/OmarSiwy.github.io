---
title: Multiplexer Tree
description: "2^n-1 MUX2s in n levels: no gate ever exceeds two inputs, depth grows as log, and it is the only mux form that scales past n=3 without an unbuildable gate."
kind: circuit
status: seed
spade: simulated
tags: [digital, combinational-logic, multiplexer, shannon]
aliases:
  - Mux Tree
  - Multiplexer Trees
  - Tree Multiplexer
  - Balanced Mux Tree
---

# Multiplexer Tree

A $2^n\!:\!1$ multiplexer built as a binary tree of $2^n-1$ two-input muxes in $n$ levels — the only mux construction whose widest gate stays at two inputs no matter how large $n$ gets.

```tikz title="8:1 multiplexer as a three-level binary tree of MUX2, with select fanout per level"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- level 1: four MUX2 ----------
  \foreach \c/\a/\b in {-0.6/D_0/D_1, -2.8/D_2/D_3, -5.0/D_4/D_5, -7.2/D_6/D_7} {
    \draw (1.2,\c+0.65) -- (2.0,\c+0.35) -- (2.0,\c-0.35) -- (1.2,\c-0.65) -- cycle;
    \node[font=\tiny] at (1.6,\c) {MUX};
    \draw (-0.3,\c+0.4) node[anchor=east] {$\a$} -- (1.2,\c+0.4);
    \draw (-0.3,\c-0.4) node[anchor=east] {$\b$} -- (1.2,\c-0.4);
    \draw (1.6,\c-0.85) -- (1.6,\c-0.5);
    \node[anchor=north, font=\footnotesize] at (1.6,\c-0.85) {$s_0$};
  }
  % ---------- level 2: two MUX2 ----------
  \foreach \c in {-1.7, -6.1} {
    \draw (4.0,\c+0.65) -- (4.8,\c+0.35) -- (4.8,\c-0.35) -- (4.0,\c-0.65) -- cycle;
    \node[font=\tiny] at (4.4,\c) {MUX};
    \draw (4.4,\c-0.85) -- (4.4,\c-0.5);
    \node[anchor=north, font=\footnotesize] at (4.4,\c-0.85) {$s_1$};
  }
  % ---------- level 3: one MUX2 ----------
  \draw (6.8,-3.25) -- (7.6,-3.55) -- (7.6,-4.25) -- (6.8,-4.55) -- cycle;
  \node[font=\tiny] at (7.2,-3.9) {MUX};
  \draw (7.2,-4.75) -- (7.2,-4.40);
  \node[anchor=north, font=\footnotesize] at (7.2,-4.75) {$s_2$};

  % ---------- level 1 -> level 2 ----------
  \draw (2.0,-0.6) -- (3.2,-0.6) -- (3.2,-1.3) -- (4.0,-1.3);
  \draw (2.0,-2.8) -- (3.2,-2.8) -- (3.2,-2.1) -- (4.0,-2.1);
  \draw (2.0,-5.0) -- (3.2,-5.0) -- (3.2,-5.7) -- (4.0,-5.7);
  \draw (2.0,-7.2) -- (3.2,-7.2) -- (3.2,-6.5) -- (4.0,-6.5);
  % ---------- level 2 -> level 3 ----------
  \draw (4.8,-1.7) -- (6.0,-1.7) -- (6.0,-3.5) -- (6.8,-3.5);
  \draw (4.8,-6.1) -- (6.0,-6.1) -- (6.0,-4.3) -- (6.8,-4.3);
  % ---------- output ----------
  \draw (7.6,-3.9) -- (9.0,-3.9);
  \node[anchor=west] at (9.05,-3.9) {$Y$};

  % ---------- bit widths ----------
  \draw (0.4,-0.35) -- (0.6,-0.05);  \node[anchor=south, font=\tiny] at (0.5,-0.05) {$w$};
  \draw (2.4,-0.75) -- (2.6,-0.45);  \node[anchor=south, font=\tiny] at (2.5,-0.45) {$w$};
  \draw (5.2,-1.85) -- (5.4,-1.55);  \node[anchor=south, font=\tiny] at (5.3,-1.55) {$w$};
  \draw (8.2,-4.05) -- (8.4,-3.75);  \node[anchor=south, font=\tiny] at (8.3,-3.75) {$w$};
  \draw (7.05,-4.70) -- (7.35,-4.45); \node[anchor=west, font=\tiny] at (7.42,-4.52) {$1$};

  % ---------- level headings ----------
  \node[align=center, font=\footnotesize] at (1.6,0.55) {level 1\\ $4$ MUX2};
  \node[align=center, font=\footnotesize] at (4.4,0.55) {level 2\\ $2$ MUX2};
  \node[align=center, font=\footnotesize] at (7.2,0.55) {level 3\\ $1$ MUX2};

  % ---------- annotation ----------
  \node[anchor=north west, align=left, text=black!60, font=\footnotesize] at (-1.6,-8.4)
    {$4+2+1 = 2^3-1 = 7$ MUX2, depth $n=3$, widest gate $2$ inputs.\\
     All four $s_0$ stubs are one net: select fanout is $4$, $2$, $1$ by level,\\
     so the branching effort $b$ halves as the data path narrows.\\
     Data wires $w$ bits, select wires $1$ bit.};
\end{circuitikz}
\end{document}
```

*My own construction from the Shannon recursion below; the $\tau$ numbers quoted in the text are the $n=2$ case worked in [[Logical Effort]].*

**Derive the tree instead of drawing it.** Do not start from "a mux selects one of $2^n$ inputs" — start from the [[Shannon Expansion]] $f = \bar x_k f_{\bar x_k} + x_k f_{x_k}$, whose right-hand side *is* a MUX2 with select $x_k$ and data inputs the two cofactors. Applying it to the multiplexer's own function with $s_{n-1}$ as the expansion variable splits the $2^n$ data inputs into a low half and a high half and leaves one MUX2 at the root. Each half is a $2^{n-1}\!:\!1$ multiplexer on $s_{n-2},\dots,s_0$, so the same step applies again. The tree is not a design choice — it is what the recursion leaves behind after $n$ steps, and it terminates because each step removes exactly one select variable.

**Count the recursion, do not count the picture.** Let $M(n)$ be the number of MUX2s. One step is one root mux plus two subtrees, so $M(n) = 2M(n-1) + 1$ with $M(0) = 0$ (a $1\!:\!1$ mux is a wire). This is the standard inhomogeneous linear recurrence; adding $1$ to both sides gives $M(n)+1 = 2\,(M(n-1)+1)$, a pure geometric recurrence in $M(n)+1$ with initial value $1$, hence $M(n)+1 = 2^n$ and $M(n) = 2^n - 1$. Depth is one mux per step, so exactly $n = \log_2(\text{input count})$. For $w$-bit data the picture is $w$ independent copies of the same tree sharing one select bus: $w(2^n-1)$ one-bit MUX2s, $n$ select wires of $1$ bit each, every data wire $w$ bits, and the depth is unchanged because the copies are parallel.

**Price the depth with logical effort, because level counts lie.** From the MUX2 entry of [[Logical Effort]], $g = 2$ and $p = 4$ per data or select input. The data path is $N = n$ MUX2 stages with no branching, so $G = 2^n$, $B = 1$, $H = 1$ and $F = 2^n$. The equal-effort optimum $\hat f = F^{1/N}$ gives $\hat f = (2^n)^{1/n} = 2$ — the same stage effort at every depth, which is why the tree scales gracefully — and $P = 4n$, so

$$D_{\text{data}} = N\hat f + P = 2n + 4n = 6n\,\tau$$

At $n=2$ this is $12\,\tau$, matching the $4\!:\!1$ comparison in [[Logical Effort]] where the flat two-level form comes in at $13.6\,\tau$ despite being two levels shallower. The tree is linear in $n$; the flat form is constant-depth and unbuildable.

**The select path is the one that changes shape with $n$.** $s_0$ drives every level-1 mux, so its branching effort is $b = 2^{n-1}$ — the fanout numbers written under the diagram. Through an inverter and one mux, $F = \underbrace{1}_{g_{\text{inv}}}\cdot\underbrace{2^{n-1}}_{b}\cdot\underbrace{2}_{g_{\text{mux}}}\cdot 1 = 2^n$ over $N=2$ stages, so $\hat f = 2^{n/2}$ and $P = 1+4 = 5$, giving $D_{\text{sel}} = 2\cdot 2^{n/2} + 5$. At $n=2$ that is $9\,\tau$ against the data path's $12\,\tau$, so the data path is critical — which is exactly what the worked $4\!:\!1$ example concludes.

> [!note] Where the select path stops being free
> $\hat f = 2^{n/2}$ passes the FO4 optimum of $\approx 4$ at $n > 4$, so from a $32\!:\!1$ mux onward $s_0$ needs its own buffer tree rather than one inverter. Its optimal stage count is $N \approx \log_4 F = n/2$, still only half the data depth, so the data path stays critical — but the select distribution has become a separate design problem with its own area, and on an ASIC that buffer tree is where a naive $2^n\!:\!1$ mux quietly loses its timing closure.

**Nothing wide ever appears, and that is the whole argument.** Logical effort charges a wide gate twice — $g$ grows linearly in the input count and $p$ grows linearly too — so past about four inputs a tree of narrow gates beats a flat gate even though the tree is deeper. The [[One-Hot Multiplexer]] pays exactly this: its output OR is $2^n$ wide, which is $256$ inputs at $n=8$ and simply not a gate. The tree's widest gate is $2$ inputs at every $n$. This is the same reassociation argument that turns a ripple carry into a prefix tree and a linear XOR chain into a balanced [[XOR Parity Tree]]; here it is not even an argument, because the recursion produces the tree directly.

**Every level is a glitch generator.** Each MUX2 $Y = \bar S A + S B$ carries a static-1 hazard: hold $A=B=1$ and toggle $S$, and the two product terms are momentarily both off while the select inverter catches up (see [[Logic Hazards]]). In a tree that hazard is per node, so one select transition can produce up to $n$ transient edges rippling to the output, each charging a full $w$-bit bus. The per-mux repair is the consensus term $D_{2i}D_{2i+1}$ — $2^n-1$ extra AND2s and $2^n-1$ widened ORs, roughly $20\%$ area, and worth nothing at all if the output feeds a register. Glitch *power*, unlike glitch *correctness*, is not fixed by the register.

**On an FPGA the tree is already in the silicon and you do not build it.** A $4\!:\!1$ mux has $4+2 = 6$ inputs and fits one LUT6 exactly: one logic level, one routing hop, and the three MUX2s of the drawing are a netlist the mapper deleted. Above six inputs the fabric continues the same Shannon recursion in dedicated cells — an $8\!:\!1$ mux is two LUT6s plus one `MUXF7`, a $16\!:\!1$ is four LUT6s plus two `MUXF7` plus one `MUXF8` — which is the tree above the LUT boundary, hardened, bypassing general routing. So the FPGA cost is not $2^n-1$ muxes but $\lceil 2^n/4 \rceil$ LUT6s and the `MUXF` cells above them, and the correct FPGA instinct is to count *inputs*, not gates ([[Lookup-Tables]]).

$$\boxed{\;M(n) = 2M(n-1)+1,\ M(0)=0 \;\Rightarrow\; M(n) = 2^n-1 \text{ MUX2},\quad \text{depth } n,\quad D_{\text{data}} = 6n\,\tau\;}$$

**When it breaks.**

- **$n \le 2$.** At $2\!:\!1$ there is no tree. At $4\!:\!1$ the tree wins delay ($12\,\tau$ vs $13.6\,\tau$) but loses area — $11$ gates and $20$ gate-inputs against the flat form's $7$ and $18$. The structural argument only becomes decisive at $n \ge 3$, where the flat form needs an OR of eight or more.
- **A select that is already one-hot.** If the select arrives from a decoder, a one-hot FSM state register or a round-robin arbiter, encoding it back to binary to feed the tree costs a priority encoder in front and throws away the depth the tree saved. [[One-Hot Multiplexer]] takes over.
- **Series pass transistors.** A [[Transmission-Gate Multiplexer]] node is $6$ transistors instead of $\approx 12$, but $n$ of them in series form an RC ladder whose delay grows *quadratically* in $n$, not linearly. The $6n\,\tau$ above assumes restoring static gates; buffer every two or three levels or the model does not apply.
- **Deep unpipelined trees on an FPGA.** LUT outputs glitch freely into large routing capacitance, so a long mux cascade burns dynamic power out of proportion to its logic. The fabric's answer is the free register next to every LUT, not consensus terms.
- **Balance is an assumption, not a law.** The balanced tree minimises *worst-case* depth. If one input is latency-critical and the rest are not, an unbalanced tree that places it near the root is strictly better on that path, at the cost of depth on the others — the mux-tree analogue of Huffman coding.

**RTL.**

```spade
fn mux2<#uint W>(s: bool, d0: uint<W>, d1: uint<W>) -> uint<W> {
    if s { d1 } else { d0 }
}

// one level of the tree: halve the array under one select bit
fn mux_level<#uint K, #uint W>(s: bool, d: [uint<W>; {2 * K}]) -> [uint<W>; K] {
    d.chunks::<2>().map(fn |p| mux2(s, p[0], p[1]))
}

fn mux8<#uint W>(s: [bool; 3], d: [uint<W>; 8]) -> uint<W> {
    let l1 = mux_level::<4, W>(s[0], d);
    let l2 = mux_level::<2, W>(s[1], l1);
    mux2(s[2], l2[0], l2[1])
}
```

`mux_level` is one vertical column of the diagram: `s[0]` is the single net feeding all four level-1 stubs, and `chunks::<2>` pairs adjacent leaves so `p[0]` is the even-indexed input, i.e. `s = 0` selects $D_{2i}$. Array element $0$ is the LSB in Spade, which is why `s[0]` — the LSB of the select word — is the *first* level and not the last; swapping `s[0]` with `s[2]` compiles clean and simulates wrong on half of all random vectors. Everything is `fn`, so the block is purely combinational with no `reg` anywhere, and `W` is the diagram's $w$: the three calls describe the tree for one bit and the compiler replicates it $W$ times. The depth is fixed at three here because Spade's type expressions have no exponent operator — `[uint<W>; {1 << N}]` is rejected with *"Operator `<<` is not supported in a type expression"* — so a fully depth-generic tree cannot state its own array size; deeper trees are more `mux_level` calls. Synthesis will not preserve three literal levels in any case: it re-maps to LUT6 plus `MUXF7`, as above.

**Related notes.**

- [[Shannon Expansion]] – depends-on: the identity whose $n$-fold recursion *is* this tree; the note stops at one step, this one runs it to the leaves.
- [[One-Hot Multiplexer]] – compares: the flat sibling, two levels on paper and a $2^n$-wide OR in reality.
- [[Transmission-Gate Multiplexer]] – extends: what a single node of this tree becomes in CMOS, and the quadratic RC ladder that follows.
- [[Lookup-Tables]] – counter-example: on an FPGA the tree is already inside the cell, so the gate-count argument evaporates below six inputs.
- [[Barrel Shifters]] – extends: one of these per output bit, with level $i$ selecting a shift of $2^i$, is the whole barrel shifter.
- [[Logical Effort]] – supports: supplies $g=2$, $p=4$ and the $\hat f = F^{1/N}$ optimum every delay number here rests on.
- [[Logic Hazards]] – supports: the per-node static-1 hazard the tree replicates $2^n-1$ times.
- [[Choosing a Combinational Block]] – compares: where this sits against every other standard block.

## References

Established digital-design canon; no assigned book source, so no page numbers.

- Mux trees, decoders and standard combinational blocks — Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Shannon expansion and cofactors — Mano & Ciletti, ch. 3.
- Logical effort ($g$, $p$, $\hat f = F^{1/N}$, FO4, the fan-in penalty), pass-transistor RC ladders and buffer insertion — Weste & Harris, *CMOS VLSI Design*, ch. 4; Sutherland, Sproull & Harris, *Logical Effort*, chs. 1-3.
- LUT6, `MUXF7`/`MUXF8` and input-counting as the FPGA area metric — see [[Lookup-Tables]].
- The $4\!:\!1$ worked comparison ($12\,\tau$ tree vs $13.6\,\tau$ flat, $11/20$ vs $7/18$ gates and gate-inputs) is re-cut from `0.2) Combinational Logic`, "Worked example: a 4:1 multiplexer, two ways".
