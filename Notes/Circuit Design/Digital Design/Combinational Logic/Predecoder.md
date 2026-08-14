---
title: Predecoder
description: "Two half-width decoders ANDed pairwise: every gate becomes an AND2 and gate-input count drops from n*2^n to O(2^n), the factoring an SRAM row decoder actually uses."
kind: circuit
source: "0.2) Combinational Logic, §Standard blocks (Decoders) and §Fan-in, fan-out and logical effort; Weste & Harris ch. 12; Mano & Ciletti ch. 4; Wakerly ch. 6"
status: seed
spade: simulated
tags: [digital, combinational-logic, decoder, fan-in, logical-effort, sram]
aliases:
  - Predecoder
  - Predecoding
  - Predecode
  - Predecoded Decoder
  - Two-Stage Decoder
---

# Predecoder

**One-line summary:** A [[Binary Decoder]] factored by associativity of AND into two half-width decoders whose one-hot outputs are ANDed pairwise — the same $2^n$ minterms, but built from narrow gates whose partial products are shared instead of from $2^n$ independent $n$-input ANDs.

```tikz title="4-to-16 decoder predecoded into two 2-to-4 decoders and a 4x4 array of AND2"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[anchor=west] at (-1.7,6.3)
    {\textbf{$4\!\to\!16$ decoder, predecoded:} two $2\!\to\!4$ decoders and $16$ AND2, no gate wider than $2$};

  % ---------- inset: one crosspoint cell ----------
  \node[and port] (g) at (1.9,5.0) {};
  \draw (g.in 1) -- ++(-1.0,0) node[anchor=east] {$A_2$~[1]};
  \draw (g.in 2) -- ++(-1.0,0) node[anchor=east] {$B_1$~[1]};
  \draw (g.out)  -- ++(0.9,0)  node[anchor=west] {$Y_9$~[1]};
  \node[anchor=west, text=black!60, font=\footnotesize, align=left] at (-1.7,3.95)
    {one crosspoint $=$ one AND2:\\ $Y_{4a+b}=A_a\wedge B_b$};

  % ---------- low predecoder: outputs B, horizontal ----------
  \draw (0.0,-0.5) rectangle (2.0,3.2);
  \node[align=center] at (1.0,1.9) {$2\!\to\!4$\\ decoder};
  \node[align=center, font=\footnotesize] at (1.0,0.7) {low half\\ $B_b$ one-hot};

  \draw[->] (-1.7,1.35) -- (0.0,1.35);
  \draw (-0.95,1.20) -- (-0.75,1.50);
  \node[anchor=south] at (-0.85,1.50) {2};
  \node[anchor=south] at (-1.7,1.40) {$x_{1:0}$};

  \foreach \b/\by in {0/0, 1/0.9, 2/1.8, 3/2.7} {
    \draw (2.0,\by) -- (7.25,\by);
    \node[anchor=west, font=\footnotesize] at (7.25,\by) {$B_\b$};
  }

  % ---------- high predecoder: outputs A, vertical ----------
  \draw (3.5,-2.9) rectangle (7.2,-1.5);
  \node[align=center] at (5.35,-2.2) {$2\!\to\!4$ decoder, high half\\ $A_a$ one-hot};

  \draw[->] (5.35,-3.9) -- (5.35,-2.9);
  \draw (5.20,-3.55) -- (5.50,-3.35);
  \node[anchor=west] at (5.50,-3.45) {2};
  \node[anchor=north] at (5.35,-3.9) {$x_{3:2}$};

  \foreach \a/\ax in {0/4.0, 1/4.9, 2/5.8, 3/6.7} {
    \draw (\ax,-1.5) -- (\ax,3.15);
    \node[anchor=south, font=\footnotesize] at (\ax,3.15) {$A_\a$};
  }

  % ---------- the 16 AND2 crosspoints ----------
  \foreach \a/\ax in {0/4.0, 1/4.9, 2/5.8, 3/6.7} {
    \foreach \b/\by [evaluate=\b as \idx using int(4*\a+\b)] in {0/0, 1/0.9, 2/1.8, 3/2.7} {
      \fill (\ax,\by) circle (0.085);
      \node[anchor=south west, font=\tiny, text=black!65]
        at ({\ax+0.07},{\by+0.03}) {$Y_{\idx}$};
    }
  }

  % ---------- output annotation ----------
  \node[anchor=west, align=left] at (7.95,-0.6)
    {$Y_{15:0}$~[16], one-hot:\\ the $16$ crosspoint\\ AND2 outputs};

  \node[anchor=north west, text=black!60, align=left, font=\footnotesize] at (-1.7,-4.4)
    {$A$ and $B$ are $4$ lines each, $1$ bit per line, one-hot within each group.\\
     flat: $16$ AND4, $64$ gate inputs, each $x_j$ driving $8$ gates.\\
     predecoded: $8$ AND2 inside the two half-decoders $+\,16$ AND2 here\\
     $=24$ AND2, $48$ gate inputs, widest gate $=2$.};
\end{circuitikz}
\end{document}
```

*Own construction; the standard crosspoint drawing of a predecoded decoder, e.g. Weste & Harris ch. 12 on SRAM row decoders. Each $\bullet$ is one AND2, not a wire junction.*

**Topic:**

**The flat decoder is not expensive because it has many gates — it is expensive because each gate is wide.** [[Binary Decoder]] realises $Y_i=\prod_j x_j^{(i_j)}$ for $i\in[0,2^n)$ as $2^n$ AND gates of $n$ inputs each, where $x_j^{(1)}=x_j$ and $x_j^{(0)}=\overline{x_j}$. Input $x$ is $n$ bits, output $Y$ is $2^n$ bits and one-hot. The gate count $2^n$ is forced: there are $2^n$ distinct outputs and each needs at least one gate, so no construction beats $\Omega(2^n)$ gates. What is *not* forced is the $n2^n$ **gate inputs**, and that is the number that hurts, because it is simultaneously an area, a wire-load and — through fan-in — a delay term.

**Factor the minterm by associativity of AND, and the shared subproduct is the entire saving.** Split the index $i$ as $i=2^{n/2}a+b$ with $a,b\in[0,2^{n/2})$, matching the split of $x$ into a high half $x_{n-1:n/2}$ and a low half $x_{n/2-1:0}$. The product over $j$ then splits by **associativity of AND**:

$$Y_i=\Big(\prod_{j\ge n/2}x_j^{(i_j)}\Big)\wedge\Big(\prod_{j< n/2}x_j^{(i_j)}\Big)=A_a\wedge B_b$$

$A$ and $B$ are themselves $\tfrac n2 \to 2^{n/2}$ decoders — $2^{n/2}$ lines each, 1 bit per line. Nothing here is an approximation; it is the same Boolean function regrouped. The point is that $A_a$ is a subexpression of $2^{n/2}$ different outputs (every $Y_i$ whose high half is $a$), so computing it once and fanning it out replaces $2^{n/2}$ redundant evaluations. Predecoding is common-subexpression elimination applied to the minterm set, and the crosspoint array in the diagram is just the outer product $A\otimes B$ made physical.

**One-hot survives the factoring, which is the only correctness obligation.** Exactly one $A_a$ is high and exactly one $B_b$ is high, so exactly one product $A_a\wedge B_b$ is high — the pair $(a,b)$ is a bijection onto $i$ by the base-$2^{n/2}$ decomposition. Downstream consumers that *require* one-hot — a [[One-Hot Multiplexer]], an SRAM wordline driver, a [[Demultiplexer]]'s enable fan-out — therefore need no revalidation. This is worth stating explicitly because the sibling factoring for encoders does *not* preserve its precondition: see [[Binary Encoder]].

**Count it, and then recurse until every gate is an AND2.** With $k$ groups of $m=n/k$ bits, stage 1 costs $k2^m$ AND$m$ gates ($n2^m$ gate inputs) and stage 2 costs $2^n$ AND$k$ gates ($k2^n$ gate inputs), so

$$\text{inputs}(k)=k\,2^{n}+n\,2^{n/k}$$

At $k=2$ and $n=8$ that is $512+128=640$ against the flat $8\cdot256=2048$. But $k=2$ leaves AND4s inside the half-decoders, so the promise "every gate is an AND2" only holds if the split is applied **recursively**: decode $\tfrac n2$ groups of 2 bits, pair them into 4-bit groups, pair those into 8-bit groups. At $n=8$ that is $4\cdot4=16$, then $2\cdot16=32$, then $256$ AND2 gates — $304$ gates, $608$ inputs, depth $\lceil\log_2 8\rceil=3$. The last level always dominates, so the total is $2^n(1+o(1))$ gates:

$$\text{inputs} = 2\sum_{j=1}^{\log_2 n} \frac{n}{2^{j}}\,2^{2^{j}} = \Theta(2^n)$$

which is within a constant factor of the $\Omega(2^n)$ lower bound above. Depth grows from 1 to $\lceil\log_2 n\rceil$ AND2 levels, and the next paragraph is why that trade is not a trade at all.

**A wide gate is charged twice, and the flat decoder is stage-starved on top of it.** [[Logical Effort]] prices delay as $d=gh+p$; for NAND$n$ both terms grow linearly, $g=\tfrac{n+2}{3}$ and $p=n$. Price the two 8→256 decoders on the path from one address bit to one output, unit load, using $D_{\min}=NF^{1/N}+P$ with $F=GBH$.

*Flat*, $N=3$ stages INV → NAND8 → INV: $G=\tfrac{10}{3}$, $P=1+8+1=10$. The address inverter drives half the outputs, so $B=128$ and $F=426.7$; $F^{1/3}=7.53$ and $D=3(7.53)+10=32.6\,\tau$.

*Predecoded*, $N=5$ stages INV → NAND4 → INV → NAND2 → INV: $G=1\cdot2\cdot1\cdot\tfrac43\cdot1=\tfrac83$, $P=1+4+1+2+1=9$. Branching is $8$ at the address inverter (half of its 16-line half-decoder) and $16$ at the predecode-line buffer (each $A_a$ selects 16 outputs), so $B=8\cdot16=128$ again and $F=341.3$; $F^{1/5}=3.21$ and $D=5(3.21)+9=25.1\,\tau$.

> [!important] Branching is conserved; predecoding buys $G$, $P$, and the stages the effort already demanded
> $B=128$ in both designs, because one address line must reach 128 of the 256 outputs either way — no topology changes that. What changes is $G$ ($3.33\to2.67$), $P$ ($10\to9$), and above all the stage effort: the flat decoder runs at $F^{1/N}=7.5$ per stage, far above the optimum $\hat f\approx4$, while the predecoded one sits at $3.2$. The extra levels are not a cost paid for narrower gates — they are levels the effort-optimal design wanted anyway, and predecoding is how you get them for free instead of by inserting buffers.

**In an SRAM the binding constraint is pitch, not delay.** The final gate of a row decoder must physically fit within one bitcell height. An AND8 stack cannot; an AND2 or NAND2 can, and the predecode lines run horizontally across the array as a shared bus rather than $2n$ address rails feeding $2^n$ wide gates. Predecoding is chosen there for layout before it is chosen for speed, which is why [[Block Memory]] hardens exactly this structure and exposes only the address port. Groups of 2 or 3 bits are the usual choice: 3-bit groups give NAND3 predecoders and fewer second-level inputs, at 8 predecode lines per group instead of 4.

**On an FPGA the entire argument evaporates below $n=6$.** A LUT$k$ has one delay independent of how many inputs it uses, so fan-in is free up to $k$ and an $n\to2^n$ decoder for $n\le6$ is $2^n$ LUT6s at one level — predecoding it can only add levels. Above $k$ the LUT tree reappears and the mapper builds it for you; hand-predecoding then merely picks the grouping, and picking it badly is a real risk since the mapper sees the shared subexpressions too. The one place it still pays on FPGA is address decode into [[Block Memory]], where the BRAM's own decoder is hard silicon and free, so the correct move is to stop decoding in fabric entirely.

**Result.**

$$\boxed{\ Y_{2^{n/2}a+b}=A_a\wedge B_b;\qquad \text{inputs}(k)=k2^{n}+n2^{n/k}\ \xrightarrow{\ \text{recursive}\ }\ \Theta(2^n)\ \text{at depth}\ \lceil\log_2 n\rceil\ }$$

**When it breaks.**

- **$n\le3$.** An AND3 has $g=\tfrac53$ and fits any pitch; predecoding adds a level and a buffer for nothing. The crossover is the same $n\approx4$ at which [[Logical Effort]] says wide gates start losing.
- **$n$ not divisible by $k$.** Unequal groups are legal — $8=3+3+2$ is common — but the second-level fan-in becomes the group *count*, so an aggressive split re-creates the wide gate it was meant to remove. $\text{inputs}(k)$ is minimised at small $k$ precisely because the $k2^n$ term dominates.
- **Glitches multiply.** Two levels of AND fed by skewed address arrivals produce transient non-one-hot codes on $Y$, and unlike the flat decoder there is an intermediate level to glitch as well. Harmless into a register, destructive into a wordline or a wired-OR — see [[Logic Hazards]].
- **Enable placement.** Gating enable into the *predecoders* leaves the crosspoint array floating all-zero, which is usually what you want; gating it into the crosspoints costs an extra input on $2^n$ gates and undoes the fan-in win.
- **Very small $2^n$ with very wide outputs.** If each decoded line drives a large load, the design is dominated by the output drivers and $H$ swamps $G$; the decoder topology stops mattering.

**RTL (Spade).**

```spade
fn dec2(x: uint<2>) -> uint<4> {
    let b = x.as_bits();
    [!b[1] && !b[0],
     !b[1] &&  b[0],
      b[1] && !b[0],
      b[1] &&  b[0]].as_uint()
}

fn and_row(sel: bool, m: [bool; 4]) -> [bool; 4] {
    m.map(fn |v| v && sel)
}

fn predecode4(x: uint<4>) -> uint<16> {
    let b  = x.as_bits();
    let lo = dec2(b[0..2].as_uint()).as_bits();
    let hi = dec2(b[2..4].as_uint()).as_bits();
    [and_row(hi[0], lo),
     and_row(hi[1], lo),
     and_row(hi[2], lo),
     and_row(hi[3], lo)].flatten().as_uint()
}
```

`lo` is $B_{3:0}$ and `hi` is $A_{3:0}$ — the two half-decoders of the drawing, 4 lines each; `and_row` is one column of the crosspoint array, and `flatten` stacks the four columns so that element $4a+b$ is $Y_{4a+b}$, matching the index labels. Everything is `fn`, so it is purely combinational with no clock and no `reg`. Widths are exact by construction: `[bool; 4]` → `uint<4>` and `[[bool; 4]; 4]` → `[bool; 16]` → `uint<16>`, with array element 0 in the **least**-significant position — the one convention that would silently bit-reverse the decoder, which is why the testbench checks $x=1$ against $x=4$ rather than only symmetric vectors. Synthesis will not preserve the two-level shape: with no fan-in constraint the mapper re-flattens this to 16 AND4s (or 16 LUT4s), so the physical predecoder needs the grouping pinned by a `dont_touch`, a hard macro, or a technology library whose widest AND *is* an AND2.

**Related Notes (with context):**

- [[Binary Decoder]] – depends-on: supplies $Y_i=\prod_j x_j^{(i_j)}$ and the flat $n2^n$ cost this note factors.
- [[Logical Effort]] – depends-on: $d=gh+p$ with $g,p$ both linear in fan-in is the quantitative reason narrow-and-deep beats wide-and-flat here, and $D_{\min}=NF^{1/N}+P$ produces the $32.6\,\tau\to25.1\,\tau$ comparison.
- [[Block Memory]] – supports: hardens exactly this structure, chosen for bitcell pitch before speed.
- [[One-Hot Multiplexer]] – supports: the consumer that depends on the preserved one-hot invariant, and the same shared-subproduct trick applied to the select side.
- [[Demultiplexer]] – extends: a decoder plus a data AND per output, so it inherits the predecoded structure unchanged.
- [[Binary Encoder]] – compares: the inverse block, whose factoring does *not* preserve its one-hot precondition.
- [[Multiplexer Tree]] – compares: the same fan-in-to-depth reassociation on a different block, and the same $n\approx4$ crossover.
- [[Logic Hazards]] – counter-example: the second AND level is a new glitch source the flat decoder does not have.
- [[Choosing a Combinational Block]] – compares: where this sits against every sibling in the folder.

## References

- `0.2) Combinational Logic`, §*Standard blocks* → **Decoders** — the $n2^n$ flat cost, the half-split, and "this is exactly the factoring an SRAM row decoder uses".
- `0.2) Combinational Logic`, §*Fan-in, fan-out and logical effort* — the $g$/$p$ table, $d=gh+p$, $F=GBH$, $D_{\min}=NF^{1/N}+P$, and $\hat f\approx4$ (FO4).
- Weste & Harris, *CMOS VLSI Design*, ch. 12 (Memory) — predecoding, row-decoder pitch matching, 2- and 3-bit predecode groups.
- Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6 — decoder expansion and two-level decoder construction.

> [!warning] Printed page numbers not verified
> This note is outside the *Application-Specific Arithmetic* source; the three textbook citations are chapter-level. No copy was consulted, so no page numbers are given. The gate counts, the $\Theta(2^n)$ bound and the two logical-effort delays are all derived above from the tables in `0.2) Combinational Logic` and can be reproduced line by line.

> [!warning] The long-form note's cost figure is loose
> `0.2) Combinational Logic` says the two-way split drops the count "from $n2^n$ to $2\cdot2^{n+1}$-ish gate inputs". The exact figure is $2\cdot2^{n}+n\,2^{n/2}$ — for $n=8$, $640$, not the $\approx1024$ that expression suggests. The "-ish" is hedged in the source; the exact form is used here.
