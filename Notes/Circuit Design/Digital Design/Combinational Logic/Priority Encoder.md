---
title: Priority Encoder
description: "Removes the one-hot precondition by returning the index of the highest set bit; the naive ripple of length 2^n reassociates into a log-depth prefix-OR plus mask plus plain encoder."
kind: circuit
source: "0.2) Combinational Logic §Standard blocks, §Encoders and priority encoders — no book source"
status: seed
spade: simulated
tags: [digital, combinational-logic, encoder, prefix, arbitration]
aliases:
  - Priority Encoders
  - Fixed-Priority Encoder
  - Priority Resolver
---

# Priority Encoder

The encoder made **total**: it returns the index of the *highest* set bit, so every one of the $2^w$ input words has a defined output instead of only the $w$ one-hot ones.

```tikz title="8-to-3 priority encoder: log-depth prefix-OR, mask to one-hot, plain encoder, with a worked input vector"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \node[anchor=west] at (-2.6,2.9) {$8\!\to\!3$ priority encoder --- index of the \emph{highest} set bit};

  \draw (0,-1.0) rectangle (3.8,1.0);
  \node[align=center] at (1.9,0.15) {prefix-OR, downward\\ $h_k=\bigvee_{j>k}x_j$};
  \node[anchor=north, font=\footnotesize, text=black!60] at (1.9,-1.15) {shifts $1,2,4$ --- depth $3$};

  \draw (5.8,-1.0) rectangle (8.8,1.0);
  \node[align=center] at (7.3,0.15) {mask\\ $s_k = x_k\,\overline{h_k}$};
  \node[anchor=north, font=\footnotesize, text=black!60] at (7.3,-1.15) {8 AND2 $+$ 8 INV --- depth $1$};

  \draw (10.8,-1.0) rectangle (13.2,1.0);
  \node[align=center] at (12.0,0.15) {encoder\\ (wire-OR)};
  \node[anchor=north, font=\footnotesize, text=black!60] at (12.0,-1.15) {3 OR4 --- depth $2$};

  \draw[->] (-2.4,0.0) -- (0,0.0);
  \draw (-1.5,-0.15) -- (-1.3,0.15);
  \node[anchor=south] at (-1.4,0.18) {8};
  \node[anchor=south] at (-2.4,0.08) {$x[7:0]$};

  % x branches around the prefix network to the mask stage
  \fill (-0.8,0.0) circle (1.6pt);
  \draw[->] (-0.8,0.0) -- (-0.8,-2.4) -- (5.0,-2.4) -- (5.0,-0.5) -- (5.8,-0.5);
  \draw (1.7,-2.55) -- (1.9,-2.25);
  \node[anchor=south] at (2.5,-2.32) {$x$, 8};

  \draw[->] (3.8,0.5) -- (5.8,0.5);
  \draw (4.7,0.35) -- (4.9,0.65);
  \node[anchor=south] at (4.8,0.68) {8};
  \node[anchor=north] at (4.15,0.42) {$h$};

  \draw[->] (8.8,0.0) -- (10.8,0.0);
  \draw (9.7,-0.15) -- (9.9,0.15);
  \node[anchor=south] at (9.8,0.18) {8};
  \node[anchor=north] at (9.8,-0.25) {$s$, one-hot};

  \draw[->] (13.2,0.3) -- (15.3,0.3);
  \draw (14.0,0.15) -- (14.2,0.45);
  \node[anchor=south] at (14.1,0.48) {3};
  \node[anchor=west] at (15.4,0.3) {index};

  % valid comes out of the same prefix network, one extra term
  \draw[->] (3.8,0.8) -- (4.6,0.8) -- (4.6,2.0) -- (14.9,2.0) -- (14.9,-0.5) -- (15.3,-0.5);
  \node[anchor=west] at (15.4,-0.5) {valid $=\bigvee_k x_k$};

  % worked vector
  \foreach \r/\lbl/\row in {0/{$x$}/{7/0,6/0,5/1,4/0,3/1,2/1,1/0,0/0},
                            1/{$h$}/{7/0,6/0,5/0,4/1,3/1,2/1,1/1,0/1},
                            2/{$s$}/{7/0,6/0,5/1,4/0,3/0,2/0,1/0,0/0}} {
    \node[anchor=east] at (-0.2,{-4.6-\r*0.62}) {\lbl};
    \foreach \i/\b [evaluate=\i as \px using (7-\i)*0.5] in \row {
      \draw (\px,{-4.85-\r*0.62}) rectangle ++(0.5,0.5);
      \node at ({\px+0.25},{-4.6-\r*0.62}) {\b};
    }
  }
  \foreach \i in {7,6,5,4,3,2,1,0} {
    \node[anchor=south, font=\tiny, text=black!60] at ({(7-\i)*0.5+0.25},-4.28) {\i};
  }
  \draw[black!55] (0.95,-4.2) -- (0.95,-6.25);
  \draw[black!55] (1.45,-4.2) -- (1.45,-6.25);
  \node[anchor=north west, text=black!60, align=left] at (4.8,-4.4)
    {bit 5 is the highest set bit: $h_5=0$ is the last $0$ of $h$,\\
     so $s_5=x_5\overline{h_5}=1$ and every lower $x_k$ is masked.\\
     Encoder output $=101$, valid $=1$.};
\end{circuitikz}
\end{document}
```

*My own construction; all buses 1 bit per wire, widths marked on each arrow.*

**Name the precondition the plain encoder cannot check.** A [[Binary Encoder]] is the inverse map of a [[Binary Decoder]]: bit $j$ of its $n$-bit output is the wire-OR $\bigvee_{k\,:\,k_j=1} x_k$ over the $2^{n-1}$ input lines whose index has bit $j$ set, $w=2^n$ inputs to $n$ outputs, one gate level of very wide ORs. That is the correct inverse **only on one-hot inputs**. Feed it two hot bits and, because OR is being asked to stand in for "select", it emits the bitwise OR of two addresses: with $x_3$ and $x_5$ hot it produces $011 \vee 101 = 111$, the address of line 7, which nobody asserted. The failure is silent — there is no state in the circuit that could detect it — so the one-hot property is an obligation on the *producer*, and the producers that matter (interrupt lines, FIFO status flags, comparator banks, exception vectors) do not honour it.

**Redefine the output so the precondition disappears.** For $x\in\{0,1\}^w$, $w=2^n$, take

$$\mathrm{idx}(x)=\max\{k : x_k=1\},\qquad \mathrm{valid}(x)=\bigvee_{k} x_k$$

$\mathrm{idx}$ is an $n$-bit output and $\mathrm{valid}$ one bit. This is a total function on all $2^w$ words — the $\max$ is over a non-empty set exactly when $\mathrm{valid}=1$ — and it agrees with the plain encoder on the one-hot inputs where the plain encoder was already right. The cost of totality is everything below.

**The literal reading is a ripple of length $w$.** Line $k$ wins iff it is asserted and nothing above it is: $s_k = x_k \wedge \bigwedge_{j>k}\overline{x_j}$. As a recurrence scanned downward from the top, with $\overline{h_{w-1}}=1$,

$$\overline{h_k} = \overline{h_{k+1}} \wedge \overline{x_{k+1}}$$

which is $w-1$ AND2 gates in series: depth $\Theta(w)$, the same serial shape as the carry chain in [[Parallel Prefix Adders]], and for the same reason — a scan written as a recurrence is a chain until you say otherwise.

**Reassociate; the operator is OR.** By De Morgan, $\bigwedge_{j>k}\overline{x_j} = \overline{\bigvee_{j>k} x_j}$, so define the strict downward prefix $h_k = \bigvee_{j>k} x_j$ and recover $s_k = x_k \wedge \overline{h_k}$ — the two rows drawn in the figure. Now $h$ is a scan of $x$ under $\vee$, and $\vee$ is **associative**, so every bracketing of $x_{w-1} \vee \cdots \vee x_{k+1}$ computes the same $h_k$. That is precisely the reassociation argument that turns a ripple carry into a prefix tree; adopt the balanced bracketing of [[Kogge-Stone Tree]] and depth falls from $w-1$ to $\lceil\log_2 w\rceil = n$, at $\Theta(w\log_2 w)$ nodes, with the sparser bracketings buying back nodes and wire for one extra level.

**Idempotence makes this scan cheaper than the carry scan.** $\vee$ is not only associative but **idempotent** ($a \vee a = a$) and has identity $0$, so overlapping windows may be combined without double-counting — the property the carry operator lacks, which is why a prefix adder must carry a two-bit $(g,a)$ tuple per node while a prefix-OR carries one bit. The consequence is the shift-OR *smear*: work with the inclusive suffix $H_k = \bigvee_{j\ge k} x_j$ and iterate

$$H \leftarrow H \vee (H \gg 1),\qquad H \vee (H\gg 2),\qquad H \vee (H \gg 4),\ \ldots$$

Each stage doubles the window: after the stages of shift $1,2,\dots,2^{m-1}$, bit $k$ of $H$ holds $\bigvee_{j=k}^{k+2^m-1} x_j$, so $\lceil\log_2 w\rceil$ stages suffice. Every stage is $w$ OR2 gates of depth 1 fed by a **constant** shift, which is pure rewiring — zero gates, and on FPGA zero routing resources beyond the wires that had to exist anyway.

**Three outputs fall out of $H$ for free.** By construction $H$ is a contiguous run of ones from $\mathrm{idx}(x)$ down to bit $0$, and all-zero when $x=0$. Therefore:

- $h_k = H_{k+1}$, so the strict prefix is just $H \gg 1$ and the mask row becomes $s = H \wedge \overline{H \gg 1}$. Since $H \gg 1$ is a *subset* of $H$ as a set of positions, AND-NOT and XOR agree there, giving $s = H \oplus (H \gg 1)$ — **one XOR row instead of an INV row plus an AND row, and $x$ never has to be routed forward** past the prefix network at all. The figure draws the definitional bypass wire; the implementation below deletes it.
- $\mathrm{valid} = H_0$. One bit of a vector already built, no extra gates — that is the wire leaving the prefix block in the drawing.
- $\mathrm{idx} = |H| - 1$, where $|H|$ is the population count, because a run of ones ending at bit 0 has length $\mathrm{idx}+1$. The leading-zero count is then $w - |H|$, which is why [[Leading Zero Counters]] is this circuit with the output relabelled and drives the shift amount in [[Normalizers]].

**Finish with the plain encoder, now legally.** $s$ is one-hot-or-zero by construction: $s_k=1$ demands $x_k=1$ and $h_k=0$, and $h_k=0$ says no bit above $k$ is set, so at most one $k$ qualifies. The precondition that the plain encoder could not check is now *established by the two stages in front of it*, and [[Binary Encoder]] applies unchanged: bit $j$ of the index is $\bigvee_{k\,:\,k_j=1} s_k$, an OR over $w/2$ terms. Build it as a tree of depth $\lceil\log_2(w/2)\rceil = n-1$ rather than one flat gate — a $w/2$-input OR has ruinous logical effort past a handful of inputs ([[Logical Effort]]).

**Add the depths up honestly.** Prefix $n$, mask $1$, encoder $n-1$, so the critical path is $2n = 2\log_2 w$ levels of 2-input gates, and the gate count is $w\log_2 w$ (smear) $+\,w$ (mask XOR) $+\,\tfrac{w}{2}\log_2 w$ (encoder tree). The $8\to3$ case annotated in the figure is $3+1+2=6$ levels.

> [!warning] The summary table in [[0.2) Combinational Logic]] under-reports this depth
> Its priority-encoder row gives depth $\lceil\log_2 2^n\rceil = n$ while its cost column says "prefix-OR + encoder", and its own encoder row separately charges that encoder $\lceil\log_2 2^{n-1}\rceil = n-1$ levels. The two cannot both hold: at $n=3$ the table says depth 3, but the path $x_5 \to h_5 \to s_5 \to \mathrm{idx}_2$ traverses 3 prefix levels, 1 mask level and 2 OR-tree levels — 6. Read the tabulated figure as the prefix network alone; the operator is $2n$.

**On FPGA the log-depth argument is mostly below the granularity of the fabric.** A 6-LUT computes *any* function of 6 inputs in one level, so a $w\le 6$ priority encoder is $n+1$ LUTs at depth 1 and the whole prefix construction is irrelevant. Above that, a fan-in count bounds any implementation from below at $\lceil\log_6 w\rceil$ LUT levels, since each index bit genuinely depends on all $w$ inputs — 2 levels at $w=32$, 3 at $w\le 216$ — and the smear-plus-mask-plus-encoder structure is what a synthesiser packs into that bound. The constant shifts cost nothing; what costs is that each smear stage is a *separate* 2-input function, so writing the log-depth form explicitly can be worse than writing the definition and letting the mapper pack 6 inputs per LUT. On ASIC the opposite holds: the explicit tree is what you want, because there the gate is 2-input and the depth is real. See [[Lookup-Tables]].

**Direction is free; the primitive that isolates a bit is not.** Reversing the input bus turns a highest-priority encoder into a lowest-priority one at zero gate cost — bit reversal is wiring. The two directions are not symmetric in *implementation*, though: isolating the **lowest** set bit is the two's-complement identity

$$x \wedge (-x) = x \wedge (\overline{x}+1)$$

a single subtract, which on FPGA rides the hardened carry chain and beats a soft $\log_2 w$-deep smear well past the widths where the asymptotics say it should not. There is no matching one-subtract trick for the highest set bit. So choose the priority direction your target has a primitive for and reverse the bus, rather than building the direction the specification happened to be written in.

$$\boxed{\ H_k=\bigvee_{j\ge k}x_j,\quad s=H\oplus(H\gg1),\quad \mathrm{idx}=\mathrm{enc}(s)=|H|-1,\quad \mathrm{valid}=H_0,\quad D=2\log_2 w\ }$$

**When it breaks**

- **$x=0$ has no answer, and the circuit returns one anyway.** $s$ is all-zero, so the encoder emits index $0$ — indistinguishable from $x=1$. `valid` is not a convenience output; it is the only thing separating those two cases, and every consumer must gate on it. In [[Normalizers]] the all-zero significand is the special case the exponent path has to intercept separately.
- **Fixed priority starves.** Line $k$ is served only when nothing above it asks, so a persistently asserted high line locks out every line below it forever. Round-robin does not change this circuit: it rotates the request bus by the last grant, encodes, and rotates the grant back — two barrel shifters ([[Shifters]]) wrapped around an unmodified priority encoder.
- **The output glitches through wrong indices.** Every input-to-index path has a different delay and the index is not monotone in any single input, so during a transition the output visits codes that are correct for no input word. Harmless into a register, fatal into anything level-sensitive or self-timed; see [[Logic Hazards]]. A [[Hazard-Free Two-Level Cover]] does not rescue it either — that construction is only defined for single-input-change transitions, and request buses change several bits at once by nature.
- **Below $w\approx 6$ the asymptotics are noise.** One LUT per output bit on FPGA, two or three gate levels on ASIC; the tree costs more to write than it saves. [[Choosing a Combinational Block]].
- **Above a few hundred bits the flat prefix loses to a hierarchy.** Split $w$ into $w/g$ groups of $g$, run a small priority encoder plus a group-OR flag per group, a second priority encoder over the $w/g$ flags, and mux the winning group's local index — the winner's global index is the $\log_2(w/g)$-bit group number concatenated with its $\log_2 g$-bit local index. That is the reduce-then-distribute shape the sparser prefix trees use, trading one mux level for a large drop in wire.
- **The encoder's OR tree is where a wide gate hides.** Index bit $n-1$ ORs $w/2$ terms; at $w=256$ that is a 128-input OR, and flattening it is the single easiest way to destroy the depth this whole construction bought ([[Logical Effort]]).

**RTL (Spade)**

```spade
fn priority_encoder8(x: uint<8>) -> (uint<3>, bool) {
    // suffix-OR, downward: H_k = OR_{j>=k} x_j, in log2(8)=3 stages
    let h1 = x  | (x  >> 1);
    let h2 = h1 | (h1 >> 2);
    let h  = h2 | (h2 >> 4);

    // H is a contiguous run of ones down from the highest set bit,
    // so H ^ (H>>1) isolates that bit: s = x & ~(H>>1)
    let s = (h ^ (h >> 1)).as_bits();

    // plain one-hot encoder: bit j of the index ORs every s_k with k_j = 1
    let i2 = s[7] || s[6] || s[5] || s[4];
    let i1 = s[7] || s[6] || s[3] || s[2];
    let i0 = s[7] || s[5] || s[3] || s[1];

    ([i0, i1, i2].as_uint(), h.as_bits()[0])
}
```

`h1`, `h2`, `h` are the three levels inside the prefix-OR box — the diagram's "shifts $1,2,4$" — each an 8-bit vector, and `>>` on `uint<8>` returns `uint<8>` with no width growth, so nothing needs truncating anywhere in this block. `s` is the mask box collapsed to the XOR identity: the drawing's bypass wire carrying $x$ forward does not exist here, because $H \oplus (H\gg1)$ already equals $x \wedge \overline{h}$. `[i0, i1, i2].as_uint()` builds the 3-bit index with element 0 as the LSB (array packing order), and `h.as_bits()[0]` is $H_0$, the free `valid`. Entirely combinational — a `fn` cannot hold a `reg`, so the six levels are logic depth, not pipeline stages. Synthesis will not build the OR2 tree as drawn: on FPGA it repacks the whole cone into $\lceil\log_6 8\rceil = 2$ LUT levels per index bit, which is why `||` here rather than a hand-balanced tree.

Verified by simulation: all $256$ inputs exhaustively plus $3000$ random vectors against a behavioural reference, including `10000001` — the asymmetric case that catches a reversed bus, since a highest-priority encoder must answer 7 and a lowest-priority one 0.

**Related Notes**

- [[Binary Encoder]] – depends-on: the final stage, used unchanged; this note's first two stages exist only to establish its one-hot precondition.
- [[Binary Decoder]] – counter-example: the exact inverse map, and total in the direction this one is not.
- [[Parallel Prefix Adders]] – supports: the ripple-to-tree reassociation argument, imported here with $\vee$ in place of the carry operator.
- [[Kogge-Stone Tree]] – extends: the balanced bracketing that realises the $\lceil\log_2 w\rceil$ depth, minus the two-bit tuple that idempotence makes unnecessary.
- [[Leading Zero Counters]] – extends: the same $H$ vector read as $w-|H|$ instead of $|H|-1$; one relabelling, one circuit.
- [[Normalizers]] – extends: the consumer that turns this index into a shift amount, and the one that must handle the $\mathrm{valid}=0$ case itself.
- [[Logic Hazards]] – supports: why the index must be registered before anything level-sensitive sees it.
- [[Logical Effort]] – supports: the fan-in bound that forces the encoder's $w/2$-input OR into a tree.
- [[Choosing a Combinational Block]] – compares: where this sits against every sibling block.

## References

- [[0.2) Combinational Logic]] — §Standard blocks (the block table, and the encoder / priority-encoder rows), §Encoders and priority encoders (the $h_k$, $s_k$ formulation and the reassociation argument), and the worked $x=00101100$ vector reproduced in the figure.
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (encoders, priority encoders, the 74x148 as the classical part), Wakerly, *Digital Design: Principles and Practices* (cascading and enable-in/enable-out priority chains), and Weste & Harris, *CMOS VLSI Design* (prefix structures, logical effort, the shift-OR leading-one detector). Page numbers are deliberately omitted — no copy was consulted for this note.
