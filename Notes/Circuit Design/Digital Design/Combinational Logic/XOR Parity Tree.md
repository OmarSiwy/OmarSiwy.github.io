---
title: XOR Parity Tree
description: "n-1 XOR2s reassociated from a chain into a balanced tree: log depth for free, but XOR is the worst static gate there is (g=4, p=4) so the cost is gates, not levels."
kind: circuit
source: "0.2) Combinational Logic §Standard blocks (Parity row), §Fan-in, fan-out and logical effort, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, combinational-logic, xor, parity, reduction, fpga]
aliases:
  - Parity Tree
  - XOR Tree
  - XOR Reduction
  - Parity Generator
  - Parity Checker
  - Parity Trees
---

# XOR Parity Tree

The reduction of $n$ one-bit signals under $\oplus$, whose defining property is that the operator is not merely associative but **commutative**, so every bracketing *and* every permutation of the inputs is the same circuit.

```tikz title="8-input parity: the same 7 XOR2 gates as a chain (depth 7) and as a balanced tree (depth 3)"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,scale=0.95,transform shape]

% ================= (a) linear chain =================
\node[anchor=west] at (-1.3,1.9) {\textbf{(a)} chain $\big(\cdots((x_0\oplus x_1)\oplus x_2)\cdots\big)$ --- 7 gates, depth 7};

\foreach \k/\px in {1/0.6, 2/2.5, 3/4.4, 4/6.3, 5/8.2, 6/10.1, 7/12.0} {
  \node[xor port] (c\k) at (\px,0.6) {};
  \draw (c\k.in 2) -- ++(-0.28,0) -- ++(0,-0.75) node[below,inner sep=1.5pt] {$x_{\k}$};
}
\draw (c1.in 1) -- ++(-0.4,0) node[left,inner sep=2pt] {$x_0$};
\foreach \k/\n in {1/2, 2/3, 3/4, 4/5, 5/6, 6/7} {
  \draw (c\k.out) -- ++(0.22,0) |- (c\n.in 1);
}
\draw[->] (c7.out) -- ++(0.75,0) node[right,inner sep=2pt] {$P$};

% ================= (b) balanced tree =================
\node[anchor=west] at (-1.3,-1.4) {\textbf{(b)} tree $\big((x_0\oplus x_1)\oplus(x_2\oplus x_3)\big)\oplus\big((x_4\oplus x_5)\oplus(x_6\oplus x_7)\big)$ --- 7 gates, depth 3};

\foreach \k/\py/\a/\b in {1/-2.4/0/1, 2/-4.0/2/3, 3/-5.6/4/5, 4/-7.2/6/7} {
  \node[xor port] (t\k) at (1.2,\py) {};
  \draw (t\k.in 1) -- ++(-0.6,0) node[left,inner sep=2pt] {$x_{\a}$};
  \draw (t\k.in 2) -- ++(-0.6,0) node[left,inner sep=2pt] {$x_{\b}$};
}
\node[xor port] (u1) at (4.0,-3.2) {};
\node[xor port] (u2) at (4.0,-6.4) {};
\node[xor port] (v1) at (6.8,-4.8) {};

\draw (t1.out) -- ++(0.4,0) |- (u1.in 1);
\draw (t2.out) -- ++(0.4,0) |- (u1.in 2);
\draw (t3.out) -- ++(0.4,0) |- (u2.in 1);
\draw (t4.out) -- ++(0.4,0) |- (u2.in 2);
\draw (u1.out) -- ++(0.4,0) |- (v1.in 1);
\draw (u2.out) -- ++(0.4,0) |- (v1.in 2);
\draw[->] (v1.out) -- ++(0.9,0) node[right,inner sep=2pt] {$P=\bigoplus_{i=0}^{7}x_i$};

\draw[dashed,gray!60] (2.6,-1.9) -- (2.6,-7.8);
\draw[dashed,gray!60] (5.4,-1.9) -- (5.4,-7.8);
\node[gray!70] at (1.2,-1.75) {level 1};
\node[gray!70] at (4.0,-1.75) {level 2};
\node[gray!70] at (6.8,-1.75) {level 3};

\node[anchor=west] at (-1.3,-8.4) {every wire is $1$ bit; $8$ inputs, $1$ output, $n-1=7$ XOR2 in both panels};

\end{circuitikz}
\end{document}
```

**Name the algebra, because every property below is a group property.** $\oplus$ is addition in $\mathbb{F}_2$: $x\oplus y=(x+y)\bmod 2$. $(\{0,1\},\oplus)$ is an abelian group — identity $0$, associativity and commutativity inherited from integer addition, and every element is its own inverse since $x\oplus x=0$ ([[Boolean Algebra]]). The reduction

$$P=\bigoplus_{i=0}^{n-1}x_i \;=\; \Big(\textstyle\sum_i x_i\Big)\bmod 2$$

is therefore well defined *with no parentheses at all*, and equals the parity of the popcount. Inputs are $n$ signals of $1$ bit; the output $P$ is $1$ bit, whatever $n$ is — this is a reduction, so no bit-width growth occurs and none of [[Number Formats]]'s weighting applies. The $x_i$ carry no positional weight here; only their multiplicity mod 2 survives.

**Gate count is an invariant of the reduction, not of the bracketing.** Every XOR2 consumes two live values and emits one, so it lowers the live count by exactly $1$. Going from $n$ live values to $1$ therefore takes exactly $n-1$ gates, in *any* order, balanced or not. Count the gates in the two panels above: seven in each. Depth is the only free variable, and it is the height of the tree, minimised by balancing:

$$\text{chain: } n-1 \text{ levels} \quad\longrightarrow\quad \text{balanced tree: } \lceil\log_2 n\rceil \text{ levels}$$

at $n=64$, $63$ levels against $6$. That is the reassociation trick in its purest form — depth for free, no area paid — and it recurs throughout this vault (prefix carries in [[Adders]], the reduction of a column in [[Sums of Weighted Bits]]). What makes parity the *clean* case is that it is a **reduction** producing one output. A **scan** producing all $n$ prefixes cannot hold the $n-1$ bound: Kogge-Stone needs $w\log_2 w-w+1$ nodes precisely because $n$ separate outputs each want their own tree and only some sub-products can be shared.

> [!important] Commutativity is the property, not associativity — and it is what the sibling structures lack
> The prefix operator of a carry tree is associative but **not** commutative: $(g,a)$ tuples must stay in bit order, which is why Kogge-Stone's wiring is a fixed pattern of spans $1,2,4,\dots$ and why its long wires dominate its area. $\oplus$ is commutative, so an XOR tree may pair *any* two live values. Placement is free to pair whatever bits are physically adjacent, the graph can be planar with no crossings, and every node has fan-out exactly $1$ — no node in a reduction tree drives more than one consumer, so the fan-out argument that separates the prefix trees from each other has no analogue here. The dual of that freedom: a bit-order bug in a parity circuit is *undetectable by simulation*, because reversing or permuting the inputs computes the identical function.

**Price the levels with logical effort, because XOR is the worst gate in the library.** From the delay model $d=gh+p$ ([[Logical Effort]]), an XOR2 has $g=4$ and $p=4$ — against $4/3$ and $2$ for a NAND2. Fan-out is $1$ throughout a reduction tree, so each level costs

$$d_{\text{XOR2}}=4\cdot 1+4=8\,\tau,\qquad\text{versus}\qquad d_{\text{NAND2}}=\tfrac43+2\approx 3.3\,\tau$$

A 64-input parity tree is $6\times 8=48\,\tau$; an OR-reduction of the same 64 inputs and the same shape is about $22\,\tau$. The factor of $\sim\!2.4$ is structural: XOR is non-unate in both variables, so static CMOS cannot build it as one inverting series-parallel stack — the standard cell needs both polarities of both inputs and lands at 12 transistors, with each input driving two series paths, which is exactly the $g=4$. **The tree is gate-dominated, not depth-dominated**: having already collapsed $504\,\tau$ of chain into $48\,\tau$ of tree, no further restructuring helps, and the remaining win would have to come from not needing XOR at all.

> [!warning] The radix-3 option is not costed by any source here
> Most standard-cell libraries carry an XOR3 (it is the sum gate of a full adder) and it is cheaper than two XOR2s in series. A radix-3 tree would be $\lceil\log_3 n\rceil$ levels — $4$ instead of $6$ at $n=64$ — but pricing it needs that specific cell's $g$ and $p$, which neither the long-form note nor standard canon tabulates. Read them off the library you are targeting; do not assume $g=6$ by extrapolation.

**On an FPGA the same counting argument runs at radix 6, and the conclusion inverts.** A LUT6 computes *any* function of $\le 6$ inputs for a fixed price, so a 6-input parity is one LUT and XOR is free — the unit of cost is inputs consumed, not gates ([[Lookup-Tables]], [[FPGAs]]). Rerun the invariant at radix $k$: a $k$-input node kills $k-1$ live values, so a reduction from $n$ to $1$ needs

$$\Big\lceil\frac{n-1}{k-1}\Big\rceil \text{ nodes at depth } \lceil\log_k n\rceil$$

At $n=64,k=6$: $13$ LUT6 in $3$ LUT levels, against $63$ XOR2 in $6$ levels on an ASIC. Both numbers improve, and the *reason* to restructure reverses — on an ASIC you minimise XOR gates because each one is expensive; on an FPGA you minimise the support of each node because the LUT does not care which function it holds. This is the same "count inputs, not gates" rule that makes a 4:1 mux free, and it is why FPGA-targeted CRC and Hamming logic is written as flat wide XOR expressions and simply handed to the mapper.

**The masked tree is the general object; plain parity is the $m=\mathbf{1}$ case.** Replace each leaf by $m_i\wedge x_i$ and the circuit computes the $\mathbb{F}_2$ inner product $\langle m,x\rangle=\bigoplus_i m_i x_i$. Every bit of a CRC remainder, every syndrome bit of a Hamming or BCH code, and every feedback tap set of an LFSR is exactly one such tree, with $m$ a constant so the AND gates vanish into the wiring — a constant mask reduces to *which leaves you connect*. An $r\times n$ binary matrix-vector product is $r$ of these trees side by side. Plain parity is the row $m=\mathbf{1}$: as an error-detecting code it catches any **odd** number of bit flips and is blind to every even number, and it corrects nothing (see [[Error Accuracy]] for the numeric-error notion this is *not*). Note also that the sum bit of a full adder, $s=x\oplus y\oplus c$, is a 3-input parity, which is why XOR delay sets the tail of nearly every adder critical path in [[Adders]].

$$\boxed{\ \text{gates}=\Big\lceil\tfrac{n-1}{k-1}\Big\rceil\ \text{for every bracketing},\qquad \text{depth}=\lceil\log_k n\rceil\ \text{when balanced},\qquad d\approx 8\lceil\log_2 n\rceil\,\tau\ \text{at } k=2\ }$$

**When it breaks**

- **Even error multiplicities are invisible.** A single parity bit is a distance-2 code: it detects any odd number of flips, detects none of the even ones, and corrects nothing. The moment you need correction you need several masked trees, not a bigger one.
- **Glitch power, and no way to gate it.** XOR has **no controlling value** — neither $0$ nor $1$ on one input fixes the output — so every input transition propagates through every level to the output, and internal nodes toggle on essentially every vector. Switching activity at the output sits at $\approx 0.5$ regardless of input statistics, and an unbalanced tree adds skew-driven glitches on top ([[Logic Hazards]]). The same missing controlling value is why XOR trees are trivially testable and why they are the worst thing to leave unregistered in a low-power design.
- **Sharing across several trees voids the $n-1$ bound.** A full CRC or a linear GF(2) transform is $r$ trees over the same $n$ inputs, and the cheap implementation shares sub-XORs across rows. Choosing that sharing optimally is the shortest-linear-program problem over $\mathbb{F}_2$, which is NP-hard; heuristics get within a few gates and the $r(n-1)$ figure is only an upper bound.
- **A balanced tree is optimal only for a flat arrival profile.** Parity taken over an adder's sum bits, or over any datapath whose bits settle at different times, wants a tree shaped to the arrival times — late inputs near the root — not a balanced one. Same argument as for prefix trees, same fix.
- **The log stops paying long before the area does.** Depth grows as $\log_2 n$ and area as $n$, so doubling the width adds one level and $n$ gates. Past a few hundred inputs the tree is an area and power problem and the answer is pipelining for throughput, not further depth reduction.

**RTL (Spade)**

```spade
fn parity<#uint N>(x: [bool; N]) -> bool {
    gen if N == 1 {
        x[0]
    } else {
        let (lo, hi) = x.split_at::<{N/2}>();
        parity(lo) != parity(hi)
    }
}

entity parity32(x: uint<32>, m: uint<32>) -> bool {
    parity::<32>((x & m).as_bits())
}
```

`split_at::<{N/2}>()` is the bracketing itself: it halves the leaf set at every recursion step, so the emitted netlist *is* panel (b) generalised — depth $\lceil\log_2 N\rceil$, and $N-1$ XOR2 because each `gen if` arm below the leaf contributes exactly one. `!=` is the XOR: `^` is not defined on `bool` in Spade, and on `bool` inequality and XOR are the same function. `(x & m).as_bits()` is the masked leaf layer, one AND per bit, `[bool; 32]` with element $0$ the LSB — though by the commutativity above the leaf order is the one thing here that cannot be wrong. It is a `fn`, hence purely combinational: all $\lceil\log_2 32\rceil=5$ levels are logic depth, not pipeline stages. Synthesis will not preserve the shape — the stdlib's `x.as_bits().reduce_xor()` lowers to Verilog's `^` reduction operator and hands the bracketing to the mapper, which on FPGA rebuilds it at radix 6 as derived above; the explicit recursion is written out here because the bracketing *is* the note.

Simulated against a behavioural `^(x & m)` reference: 13 named vectors (including bit-0-only, MSB-only, $1+128$, and deliberately misaligned masks) plus a 4000-vector random sweep, all passing.

**Related Notes**

- [[Logical Effort]] – depends-on: supplies $g=4$, $p=4$ for XOR2 and the $d=gh+p$ model that prices every level above.
- [[Equality Comparator]] – compares: also built from XORs, but reduces them with a NOR — the XORs are the bitwise difference, the reduction is OR, and confusing the two is the standard mistake.
- [[Lookup-Tables]] – counter-example: at radix 6 the gate-cost argument inverts and XOR becomes the free operator.
- [[Logic Hazards]] – supports: XOR's missing controlling value is why this structure glitches on every level and cannot be masked.
- [[Choosing a Combinational Block]] – compares: where a reduction tree sits against the other standard blocks.
- [[Multiplexer Tree]] – compares: the other logarithmic-depth tree in this folder, built by Shannon expansion rather than by reassociation, and therefore *not* permutation-free.

## References

- [[0.2) Combinational Logic]] — §Standard blocks (the Parity row: $n-1$ XOR2, depth $\lceil\log_2 n\rceil$; and the Equality-comparator row), §Comparators and §Parity / XOR trees (the reassociation argument), §Fan-in, fan-out and logical effort (the $g$/$p$ table and $d=gh+p$), §FPGA mapping (XOR is free; 64-bit parity in $\lceil\log_6 64\rceil$ LUT levels).
- No textbook source for this topic. Standard treatment: Mano & Ciletti, *Digital Design* (parity generators and checkers, error detection); Wakerly, *Digital Design: Principles and Practices* (XOR/XNOR blocks, parity trees, and their use in codes); Weste & Harris, *CMOS VLSI Design* (XOR cell topologies and logical effort). Page numbers are deliberately omitted — no copy was consulted for this note.
