---
title: "CSA, Carry-Save Adder"
description: "A row of full adders that keeps its carries instead of rippling them: three vectors in, two out, delay independent of w — the core trick of every multiplier and divider."
kind: circuit
source: "ASA §5.2.6, pp. 110-111"
status: seed
spade: simulated
tags: [digital, adders, carry, redundant, fpga]
aliases:
  - "Carry-Save Adder"
  - "Carry-Save Adders"
  - "Carry-Save Addition"
  - "Carry-Save Form"
  - "CSA"
---

# CSA, Carry-Save Adder

The carry-save adder is a row of $w$ [[Full Adder|full adders]] with no wire between them: it consumes three $w$-bit operands and produces two, in a delay that does not depend on $w$.

```tikz title="8-bit carry-save adder: eight independent full adders, no inter-cell wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\footnotesize]
  \foreach \i [evaluate=\i as \X using -1.72*\i] in {0,...,7} {
    \draw[gray!35,dashed] (\X-0.86,-1.45) -- (\X-0.86,1.5);
    \node[draw,fill=gray!8,minimum width=1.0cm,minimum height=0.62cm] at (\X,0) {FA};
    \draw[->] (\X-0.34,0.95) -- (\X-0.34,0.32);
    \draw[->] (\X,0.95)      -- (\X,0.32);
    \draw[->] (\X+0.34,0.95) -- (\X+0.34,0.32);
    \node at (\X-0.36,1.2) {$x_{\i}$};
    \node at (\X,1.2)      {$y_{\i}$};
    \node at (\X+0.36,1.2) {$z_{\i}$};
    \draw[->] (\X+0.3,-0.32) -- (\X+0.3,-0.9);
    \node at (\X+0.3,-1.15) {$s_{\i}$};
  }
  \foreach \i/\j [evaluate=\i as \X using -1.72*\i] in {0/1,1/2,2/3,3/4,4/5,5/6,6/7,7/8} {
    \draw[very thick,->] (\X-0.3,-0.32) -- (\X-0.3,-0.9);
    \node at (\X-0.32,-1.15) {$c_{\j}$};
  }
  \node[align=center] at (-5.9,2.35)
    {$X,Y,Z$ : $8$ bits each \quad|\quad $S=s_7\ldots s_0$ : $8$ bits \quad|\quad
     $C=(c_8\,c_7\ldots c_1\,\mathbf{0})_2$ : $9$ bits \quad|\quad every wire drawn is $1$ bit};
  \node[align=center] at (-6.0,-2.0)
    {no wire crosses a dashed boundary: $\tau_\text{csa}=\tau_\text{fa}$, independent of $w$};
\end{circuitikz}
\end{document}
```

*after Fig. 5.9, p. 111.*

**Delete one wire per cell and a third operand falls out of the hole it leaves.** Start from the [[RCA, Ripple-Carry Adder]]: cell $i$ takes $x_i$, $y_i$ and the carry $c_i$ handed to it by cell $i-1$. Cut that hand-off. Cell $i$'s carry-in is now an unconnected input, and $w$ unconnected $1$-bit inputs, one per position, are exactly a third $w$-bit operand $Z=\sum_{i=0}^{w-1}2^iz_i$ (p. 110). Nothing else about the cell changes — it is the same full adder, with the same $s_i=x_i\oplus y_i\oplus z_i$ and the same majority carry $c_{i+1}=x_iy_i\vee x_iz_i\vee y_iz_i$ (Eqs. 5.2–5.4, p. 107). The carries that used to travel sideways now leave the row as outputs.

**The correctness proof is one line of linearity, and it is where the weights come from.** A full adder is, as an *integer* statement, $x_i+y_i+z_i=s_i+2c_{i+1}$ — that is the definition of the cell, not a further fact about it. Multiply the $i$-th such equation by $2^i$ and sum over $i=0,\ldots,w-1$; **by distributivity of multiplication over addition** the three left-hand sums separate into $X+Y+Z$, and on the right $\sum 2^is_i=S$ while $\sum 2^i\cdot2c_{i+1}=\sum 2^{i+1}c_{i+1}$. Hence

$$C+S \;=\; X+Y+Z \tag{5.9}$$

with $S=\sum_{i=0}^{w-1}2^is_i$ on $w$ bits and $C=\sum_{i=1}^{w}2^ic_i$ on $w+1$ bits. The index shift is the whole content of the "carry" name: $c_{i+1}$ is produced by cell $i$ but carries weight $2^{i+1}$, so **there is no $c_0$** — the rightmost cell's carry-out already weighs $2$ (p. 110). Defining $c_0\equiv0$ makes $C$ a $(w+1)$-bit vector whose LSB is structurally zero, i.e. a $w$-bit vector shifted left by one. Both outputs together are $2w+1$ bits carrying a value in $[0,3\cdot2^w-3]$, which $w+2$ binary bits would have held.

**Delay is constant because the drawing has no horizontal wires.** The critical path enters a cell and leaves it, full stop:

$$\tau_\text{csa}=\tau_\text{fa}$$

against the RCA's $\tau_\text{add}(w)=(w-1)\tau_\text{cp}+\max(\tau_\text{cp},\tau_\text{fa})$ (Eq. 5.7, p. 108). The area is unchanged — $w$ full adders either way — and no lookahead logic, no prefix tree, no speculation is bought. A [[Parallel Prefix Adders|prefix adder]] pays $O(w\log w)$ nodes and $\log_2 w$ levels to get *near* constant delay; the CSA gets genuinely constant delay for free. The catch is not in the cost model, it is in the output format.

**Carry-save form is a redundant number system, and that is the entire bill.** Read the pair $(C,S)$ digit-wise: position $i$ holds $d_i=s_i+c_i\in\{0,1,2\}$, so the value is $\sum_i 2^id_i$ over the redundant digit set $\{0,1,2\}$ — a binary system in which each digit needs two bits (footnote 1, p. 111; see [[Redundant Number Systems]]). Twice the bits for the same range, and, worse, most integers have many representations: $2$ is $(S,C)=(2,0)$ and equally $(0,2)$. Every operation whose answer depends on the *representative* rather than the value therefore breaks — comparison, sign test, zero test, rounding — and the standard repair is not a clever circuit but a capitulation: **collapse to binary with a real carry-propagate addition, then compare** (p. 111).

> [!important] A carry-save adder does not add; it *reduces*.
> $X+Y+Z$ is two additions. The row leaves $C+S$, which is one. Exactly one of the two has been performed, in constant time and for the price of a plain $w$-bit adder — the remaining one is deferred, not avoided. Every use of carry-save is an argument about *when* you pay it.

**The collapse is worth deferring exactly when it is amortised over a loop.** For a single three-operand sum needing a binary result, CSA + [[RCA, Ripple-Carry Adder|CPA]] beats two chained CPAs by one carry propagation and nothing more. The real win is iterative: in a multiplier's partial-product accumulation or a divider's partial-remainder recurrence, the loop body becomes a CSA row and the iteration time drops to $\tau_\text{fa}$ plus a register, **independent of $w$**, while the single final CPA is amortised over all $n$ iterations (p. 111). That is why carry-save is the structural core of [[Multipliers]] and [[Dividers]] rather than a curiosity in the adder chapter. Generalising from three operands to $n$ is the subject of [[Bit Heaps]] and [[Compressor Trees]]: stacking CSA rows linearly reduces $n$ operands to $2$ in $n-2$ rows, so the reduction must itself be shaped into a tree before the asymptotics behave.

**On FPGAs the CSA is a throughput device, not a latency device.** $s_i$ and $c_{i+1}$ are two Boolean functions of the *same* three inputs $x_i,y_i,z_i$, so one fracturable 6-input LUT — two 5-LUTs sharing their inputs — yields both, giving $w$ LUTs per row and **no use of the hard carry chain at all**. Compare that with the RCA, which also costs about one LUT per bit but additionally consumes the chain and delivers a non-redundant result in roughly $2.5$ ns at $w=32$ (§5.4, pp. 126–127). At those widths the hard chain has already made carry propagation cheap, so the CSA's constant delay wins nothing on a one-shot addition; it wins when the row sits inside a registered loop whose clock period you are trying to make width-independent, or when the carry chains are needed elsewhere.

> [!warning] No measured FPGA cost for a CSA row in the source
> §5.4 benchmarks adders on the hard carry chain, not carry-save rows. The one-LUT-per-bit figure above follows structurally from both outputs being $3$-input functions of the same inputs and from fracturable-LUT architecture; it is not a number the book reports, and it does not hold on a device without output-fracturable LUTs.

$$\boxed{\ C+S=X+Y+Z,\qquad \tau_\text{csa}=\tau_\text{fa}\ \text{independent of } w,\qquad d_i=s_i+c_i\in\{0,1,2\}\ }$$

**When it breaks.**

- **You need to compare, test the sign, test for zero, or round.** None is defined on a redundant representative. Collapse first; the CSA has bought you nothing on such a path.
- **You need to store the result.** $2w+1$ flip-flops instead of $w+1$. In a deeply pipelined loop the register cost can exceed the logic saved — [[High-Radix Carry-Save Adder|HRCS]] exists precisely to trade some of it back, propagating carries within $\alpha$-bit groups and registering one carry per group (Fig. 5.10, p. 112).
- **You have $n$ operands, not three.** A linear stack of CSA rows is $n-2$ rows deep: delay linear in $n$ even though it is constant in $w$. Shape it as a [[Compressor Trees|compressor tree]] over a [[Bit Heaps|bit heap]].
- **Signed operands.** The row is correct modulo $2^w$ unchanged, but only if $C$ and $S$ are given consistent two's-complement extensions and $c_w$ is discarded; the redundant pair has no MSB you can read as a sign, which is the zero/sign-test problem again in a costlier disguise.
- **One addition, then done.** With no loop to amortise over, the final CPA dominates and the whole exercise saves a single carry propagation.

**RTL (Spade).**

```spade
/// One carry-save row: three w-bit vectors in, (S, C) out.
/// Both outputs are per-bit functions of one bit position — no recursion,
/// no threading, which is precisely what "no carry chain" means.
fn csa<#uint W>(x: uint<W>, y: uint<W>, z: uint<W>) -> (uint<W>, uint<{W + 1}>) {
    let s = x ^ y ^ z;
    let c = (x & y) | (x & z) | (y & z);
    (s, c.concat(0u1))
}
```

Compare this with the RCA's body: there, one `cout` is threaded from step to step and the function must recurse. Here every bit slice is independent, so the row is two bitwise expressions and nothing else — `s` is the diagram's XOR-of-three sum outputs, `c` its majority carry outputs. The `concat(0u1)` **is** the weight shift: `concat` on integers puts its receiver in the high bits, so the majority vector lands at weights $2^1\ldots2^w$ and the structural $c_0=0$ occupies the LSB, which is why `C` is `uint<W+1>` with no `zext`. Everything is a `fn`, hence combinational and unclocked — the register that makes this useful belongs to the loop *around* it, not to the row. Synthesis will not respect the split: on an FPGA both expressions collapse into one LUT per bit, and an ASIC tool substitutes a library FA cell whose carry output has been optimised for a chain it will never sit in.

Simulated with `.zettel/sim.sh` at $w=8$: $8$ named vectors including the asymmetric $1+128+0$, $128+1+0$ and $0+1+128$, plus a $5000$-vector random sweep checking $C+S=X+Y+Z$ against Verilog's own arithmetic and $c_0=0$ on every vector. $5008$ passed, $0$ failed.

**Related notes.**

- [[Full Adder]] – depends-on: the single cell, replicated $w$ times and deliberately left unconnected.
- [[RCA, Ripple-Carry Adder]] – counter-example: identical cells, one wire added per boundary; that wire is the whole difference between $O(w)$ and $O(1)$ delay, and between a binary and a redundant result.
- [[Redundant Number Systems]] – depends-on: the digit set $\{0,1,2\}$ and why non-uniqueness is what constant-time addition costs.
- [[High-Radix Carry-Save Adder]] – extends: propagate carries within $\alpha$-bit groups to cut the carry bits stored, at a longer critical path.
- [[Compressor Trees]] – extends: the CSA is the $3{:}2$ base case; a tree of them reduces $n$ operands in logarithmic depth.
- [[Bit Heaps]] – extends: drops the row abstraction entirely and reduces a weighted multiset of bits.
- [[Multipliers]] – supports: partial-product accumulation is the canonical carry-save loop.
- [[Dividers]] – supports: the partial remainder is kept in carry-save form so the digit recurrence never propagates a carry.
- [[Choosing an Adder]] – compares: where a non-collapsing reducer sits against the carry-propagate family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.2.1 The full adder cell, p. 107 — Fig. 5.3, Eqs. 5.2–5.4 (sum and majority carry).
- §5.2.2 Ripple-carry addition, p. 108 — Eq. 5.7, the delay this circuit is defined against.
- §5.2.6 Carry-save addition, pp. 110–111 — **Fig. 5.9**, Eq. 5.9, the redundancy and comparison discussion, and footnote 1 pointing to §2.4 for the digit set $\{0,1,2\}$.
- §5.2.6, p. 112 — Fig. 5.10, the high-radix variant.
- §5.4 Adders on FPGAs, pp. 126–127 — Virtex 6 hard-carry-chain timing from [Xil14], used here only as the baseline the CSA is compared against.
- Ch. 7 (sums of weighted bits), Ch. 8 (multipliers), Ch. 9 (dividers) — where carry-save is generalised and consumed.
