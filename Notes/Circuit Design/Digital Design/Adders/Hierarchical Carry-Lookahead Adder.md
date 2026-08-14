---
title: "Hierarchical Carry-Lookahead Adder"
description: "Each CLA-m block also emits its group generate and propagate for free, so the blocks compose in a radix-m tree: log_m(w) levels of fat nodes, and the prefix formulation one paragraph early."
kind: circuit
source: "ASA §5.3.5, pp. 117-118"
status: seed
spade: simulated
tags: [digital, adder, carry, lookahead, prefix, vlsi]
aliases:
  - Recursive Carry-Lookahead Adder
  - Recursive Carry-Lookahead
  - Hierarchical CLA
  - Block Carry-Lookahead Adder
  - Multilevel Carry-Lookahead Adder
  - Group Carry-Lookahead
---

# Hierarchical Carry-Lookahead Adder

A carry-lookahead adder whose blocks export the **group** generate/propagate pair of the span they cover, so identical blocks stack into a radix-$m$ tree of depth $\lceil\log_m w\rceil$ instead of a linear chain.

```tikz title="Two-level radix-4 hierarchical carry-lookahead adder for w=16: group pairs sweep up, group carries sweep back down, the same CLA-4 block at both levels"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1cm,y=1cm,font=\footnotesize,
  blk/.style={draw,rounded corners=1pt,minimum height=1cm,align=center},
  w/.style={->,>=stealth}]

  \node[blk,minimum width=11.6cm] (L2) at (5,2.7)
    {CLA-4 (level 2), on the four group pairs: \ $c_{4k}=g_{4k-1:j}\vee p_{4k-1:j}\,c_j$};

  \node[blk,minimum width=2.3cm] (A) at (0.7,0)  {CLA-4\\$15{:}12$};
  \node[blk,minimum width=2.3cm] (B) at (3.6,0)  {CLA-4\\$11{:}8$};
  \node[blk,minimum width=2.3cm] (C) at (6.5,0)  {CLA-4\\$7{:}4$};
  \node[blk,minimum width=2.3cm] (D) at (9.4,0)  {CLA-4\\$3{:}0$};

  \node[blk,minimum width=11.6cm] (BL) at (5,-2.7)
    {bit level: $g_i=x_iy_i$, \ $p_i=x_i\oplus y_i$, \ $s_i=p_i\oplus c_i$};

  \foreach \n in {A,B,C,D} {
    \draw[w] ([xshift=-7mm]\n.south) -- ([xshift=-7mm]\n.south|-BL.north);
    \draw[w] ([xshift=7mm]\n.south|-BL.north) -- ([xshift=7mm]\n.south);
    \draw[w] ([xshift=-7mm]\n.north) -- ([xshift=-7mm]\n.north|-L2.south);
    \draw[w] ([xshift=7mm]\n.north|-L2.south) -- ([xshift=7mm]\n.north);
  }

  \node[anchor=east] at (-0.15,-1.05) {$8$};
  \node[anchor=east] at (-0.15,-1.65) {$g_i,p_i$};
  \node[anchor=west] at (1.55,-1.05) {$4$};
  \node[anchor=west] at (1.55,-1.65) {$c_{15:12}$};

  \node[anchor=east] at (-0.15,2.05) {$2$};
  \node[anchor=east] at (-0.15,1.45) {$(g_{15:12},p_{15:12})$};
  \node[anchor=west] at (1.55,2.05) {$1$};
  \node[anchor=west] at (1.55,1.45) {$c_{12}$};

  \draw[w] (12.3,2.7) -- (L2.east);
  \node[anchor=west] at (12.35,2.7) {$c_\mathrm{in}$};
  \draw[w] (L2.west) -- (-2.3,2.7);
  \node[anchor=east] at (-2.35,2.7) {$c_\mathrm{out}$};

  \draw[w] (2.6,-4.2) -- (2.6,-3.2);  \node[anchor=north] at (2.6,-4.25) {$X$ \ $16$};
  \draw[w] (4.6,-4.2) -- (4.6,-3.2);  \node[anchor=north] at (4.6,-4.25) {$Y$ \ $16$};
  \draw[w] (7.4,-3.2) -- (7.4,-4.2);  \node[anchor=north] at (7.4,-4.25) {$S$ \ $16$};
\end{circuitikz}
\end{document}
```

*Own construction — the $L=2$, $m=4$ instance of §5.3.5, p. 118. Fig. 5.14 (p. 117) draws only the level-1 row, chained left to right; the second level and the up/down bundles are what §5.3.5 adds in prose.*

**Give the block a second output and the architecture falls out of it.** A flat [[CLA, Carry-Lookahead Adder]] block of $m$ bits takes $m$ generate bits $g_{m-1..0}$, $m$ propagate bits $p_{m-1..0}$ and one carry-in $c_j$ — $2m+1$ bits — and returns the $m$ carries entering its own positions. The recursive version notices that the block can *also* emit two more bits, the generate and propagate of the whole span $[i:j]$ with $i>j$, such that (Eq. 5.24, p. 118)

$$c_{i+1}=g_{i:j}\vee p_{i:j}\,c_j$$

Two extra output bits per block, and the recurrence they satisfy is **the same shape** as the bit-level recurrence $c_{i+1}=g_i\vee p_ic_i$ the CLA was unrolling in the first place. So the identical CLA-$m$ block, fed with group pairs instead of bit pairs, composes them one radix higher. That is the entire idea; everything below is bookkeeping.

**The group pair costs nothing extra because it is the Shannon expansion of the carry-out the block already computes.** For $m=4$ the block's top carry is (Eqs. 5.25-5.27, p. 118)

$$c_4=g_{3:0}\vee p_{3:0}c_0,\qquad
p_{3:0}=p_3p_2p_1p_0,\qquad
g_{3:0}=g_3\vee p_3g_2\vee p_3p_2g_1\vee p_3p_2p_1g_0$$

Read that as the cofactor decomposition of $c_4$ on the variable $c_0$: $g_{3:0}$ is $c_4|_{c_0=0}$ and $p_{3:0}$ is the coefficient of $c_0$ in the expansion — the AND-rank/wide-OR of Eq. 5.22 sorted into the terms that contain $c_0$ and the terms that do not, by distributivity of AND over OR. A CLA-4 that computes $c_4$ at all has already built both piles; naming them separately adds wire, not gates. This is why the book calls the whole family "simply a reparenthesizing of the carry-lookahead equations" (p. 118) rather than a new circuit.

**Composition is that same operator applied one radix up, and it is associative.** Split a span $[i:j]$ at any interior point $k$ and substitute the recurrence into itself:

$$(g_{i:j},\,p_{i:j})=\big(g_{i:k}\vee p_{i:k}\,g_{k-1:j},\;\; p_{i:k}\,p_{k-1:j}\big)$$

The generate component follows by substituting $c_k=g_{k-1:j}\vee p_{k-1:j}c_j$ into $c_{i+1}=g_{i:k}\vee p_{i:k}c_k$ and distributing; the propagate component is associativity of AND. This composition is exactly the prefix operator $\circ$ of Eqs. 5.35-5.37, whose associativity the book proves two pages later on the alive-bit variant $(g_X,a_X)\circ(g_Y,a_Y)$ (p. 120) — so §5.3.5 *is* the prefix formulation, stated one section before it is named. Consequence, and it is the useful one: since $\circ$ is associative, **the shape of the tree cannot make the adder wrong**. Radix, level count and grouping are pure cost decisions. See [[Parallel Prefix Adders]] for the design space that observation opens.

**Propagate or alive — either works here, and the choice is not free downstream.** The bit-level recurrence holds with $p_i=x_i\oplus y_i$ *and* with $a_i=x_i\vee y_i$, because the two differ only when $x_i=y_i=1$, and there $g_i=1$ already forces the $\vee$ to $1$ (absorption). Carry-lookahead uses the XOR form, and that is a real economy: the same $p_i$ wire feeds the group logic *and* the sum XOR $s_i=p_i\oplus c_i$ (Eq. 5.11), so the bit level costs one AND and one XOR per bit, $w$ of each. A second property comes with it: with XOR-propagate, $g_{i:j}$ and $p_{i:j}$ are **mutually exclusive** (if every $p_k=1$ then every $g_k=0$), so every $\vee$ in the equations above may be implemented as XOR or as an arithmetic $+$ — which is what lets these expressions collapse into a LUT or into a hard carry cell.

**Depth is a round trip, not a one-way climb.** With $L=\lceil\log_m w\rceil$ levels, a carry propagates *up* the tree as group pairs and *back down* as group carries — the reduce and distribute phases the diagram draws as the two arrow directions. Counting gate levels for the $m=4$, $w=16$ picture: $1$ for the bit-level $g_i,p_i$; $2$ for each level-1 group pair (AND rank, then OR); $2$ for the level-2 carries; $2$ for the level-1 carries; $1$ for the sum XOR. That is $4L$ levels in general — $8$ here, against $33$ for a [[RCA, Ripple-Carry Adder]] of the same width. The book's "maximum number of levels is $\log_m(w)$" (p. 118) counts hierarchy levels, not the return trip; the round trip only doubles the constant, so the $\Theta(\log w)$ conclusion stands.

> [!note] The radix $m$ is a depth-versus-fan-in knob, and it has an interior optimum
> Total delay is roughly $4\lceil\log_m w\rceil\cdot d(m)$, where $d(m)$ is the delay of a gate of fan-in $m$. Raising $m$ shrinks $\log_m w$ logarithmically but grows $d(m)$ at least linearly in static CMOS — a wide OR is a tree once it stops being a gate, which is the exact failure that capped the flat CLA at $m=4$ in the first place (p. 117). The product therefore has a minimum at small $m$, and $m=4$ is the classic landing spot: it is the largest span whose $g_{i:j}$ still reads as four product terms.

**Area stays linear in $w$; only the constant moves.** The tree has $w/m$ level-1 blocks, $w/m^2$ level-2 blocks and so on, summing by the geometric series to $\frac{w}{m-1}\big(1-m^{-L}\big)<\frac{w}{m-1}$ blocks. Each block is $O(m^2)$ gate inputs — the $k$-th product term of $g_{i:j}$ has $k+1$ literals, so $\sum_{k=1}^{m}(k+1)=\Theta(m^2)$ — giving $\Theta(wm)$ total. No datapath is ever duplicated: unlike [[Carry-Select Adder]] and [[Conditional-Sum Adder]], which compute sums twice and select, this replicates only the carry network. Fan-out is bounded by $m$ and **independent of $w$** — a group carry $c_{4k}$ drives the $m-1$ carry terms inside one child block plus one sum XOR — which is the property [[Sklansky Tree]] sacrifices at $w/2$.

**Structurally this is Brent-Kung at radix $m$.** Reduce upward, distribute downward, no node ever driving more than a constant number of consumers, sparse output set at the internal levels: [[Brent-Kung Tree]] is the $m=2$ case drawn as a prefix graph rather than as blocks. Going to $m=4$ trades $\log_2 w$ shallow levels for $\log_4 w$ fat ones — half the levels, each roughly twice the delay and four times the local gate count, and a quarter the number of nodes. Against [[Kogge-Stone Tree]] the comparison is the other way: Kogge-Stone hits $\lceil\log_2 w\rceil$ *one-way* depth with no distribute phase at all, and pays $w\log_2 w$ nodes and long wires for it. Against [[Conditional-Sum Adder]] the book's own summary applies (p. 118): a shallower tree, $\log_m(w)$ levels instead of $\log_2(w)$, but more complex nodes.

**On an FPGA the block boundary should follow the LUT, not the textbook.** $g_{3:0}$ depends on the seven literals $g_3,p_3,g_2,p_2,g_1,p_1,g_0$ — one input too many for a 6-LUT, so a radix-4 group pair costs two LUT levels. At $m=3$, $g_{2:0}=g_2\vee p_2g_1\vee p_2p_1g_0$ has five literals and $p_{2:0}$ has three, so an entire radix-3 node fits in a single 6-LUT delay. That is the FPGA-native radix for this structure — and it is still usually the wrong circuit, because `+` maps to the hardened carry chain whose per-bit delay is an order of magnitude below one LUT delay; see [[FPGA Hard Carry Chain Adder]]. On ASIC the reasoning inverts: fan-in cost is continuous rather than quantised at 6, and $m=4$ wins.

$$\boxed{\ (g_{i:j},p_{i:j})=\big(g_{i:k}\vee p_{i:k}g_{k-1:j},\ p_{i:k}p_{k-1:j}\big),\qquad c_{i+1}=g_{i:j}\vee p_{i:j}c_j,\qquad \text{depth}=\Theta(\log_m w)\ }$$

**When it breaks.** Below $w\approx 16$ the round trip costs more than it saves — two levels of radix-4 blocks are $8$ gate levels, and a $w=8$ ripple is $17$, so the crossover is real but shallow; see [[Choosing an Adder]]. When $w$ is not a power of $m$ the top level is partly idle and the ragged block gets a smaller span, which is harmless but makes the $w/(m-1)$ block count an over-estimate. When the fabric is an FPGA, at any width the hard chain wins. When the arrival profile is skewed — one operand late out of a multiplier's compressor tree — a uniform tree is the wrong shape and the sizing should follow the profile. And the whole family assumes a **non-redundant** input: give it a carry-save pair and there is nothing to look ahead over, since the point of [[CSA, Carry-Save Adder]] is to have no carry chain at all. Format and exactness are unaffected — $c_\text{out}S$ is $w+1$ bits and represents $X+Y+c_\text{in}$ exactly, so nothing here touches [[Error Accuracy]].

> [!warning] Cost figures for the tree are not in the source
> The book gives the recurrence and the level count, then delegates the construction to [EL04] ("the details can be found in", p. 118). It states no node count, no area model, no gate-level delay and no optimal $m$. The $4L$ depth, the $w/(m-1)$ block count, the $\Theta(m^2)$ per-node gate inputs and the $m=3$ LUT-fit argument above are derived here from the equations, not quoted — they are checkable by hand but they are not the book's numbers.

**In Spade.** One radix-4 node, split into its up-sweep half (`gp4`) and its down-sweep half (`car4`), then used at both levels of a 16-bit adder. The split is a coding convenience, not two circuits: `gp4` is `car4`'s carry-out expression with $c_j$ forced to $0$, so synthesis shares the product terms.

```spade
/// Up-sweep: the group pair over the four (g,p) pairs this node spans.
fn gp4(g: uint<4>, p: uint<4>) -> (bool, bool) {
    let gb = g.as_bits();
    let pb = p.as_bits();
    let gg = gb[3] || (pb[3] && gb[2]) || (pb[3] && pb[2] && gb[1])
                   || (pb[3] && pb[2] && pb[1] && gb[0]);
    let pp = pb[3] && pb[2] && pb[1] && pb[0];
    (gg, pp)
}

/// Down-sweep: expand one incoming carry into the four carries entering the
/// positions this node spans.  Bit k = carry into position k.
fn car4(g: uint<4>, p: uint<4>, cin: bool) -> uint<4> {
    let gb = g.as_bits();
    let pb = p.as_bits();
    let c1 = gb[0] || (pb[0] && cin);
    let c2 = gb[1] || (pb[1] && gb[0]) || (pb[1] && pb[0] && cin);
    let c3 = gb[2] || (pb[2] && gb[1]) || (pb[2] && pb[1] && gb[0])
                   || (pb[2] && pb[1] && pb[0] && cin);
    [cin, c1, c2, c3].as_uint()
}

fn cla16(x: uint<16>, y: uint<16>, cin: bool) -> uint<17> {
    let gb = (x & y).as_bits();          // bit level: g_i = x_i y_i
    let pb = (x ^ y).as_bits();          //            p_i = x_i xor y_i

    let g0 = gb[0..4].as_uint();    let p0 = pb[0..4].as_uint();
    let g1 = gb[4..8].as_uint();    let p1 = pb[4..8].as_uint();
    let g2 = gb[8..12].as_uint();   let p2 = pb[8..12].as_uint();
    let g3 = gb[12..16].as_uint();  let p3 = pb[12..16].as_uint();

    let (gg0, pp0) = gp4(g0, p0);        // four level-1 nodes, up
    let (gg1, pp1) = gp4(g1, p1);
    let (gg2, pp2) = gp4(g2, p2);
    let (gg3, pp3) = gp4(g3, p3);
    let gG = [gg0, gg1, gg2, gg3].as_uint();
    let pG = [pp0, pp1, pp2, pp3].as_uint();

    let gc = car4(gG, pG, cin).as_bits();  // level-2 node: the four group carries

    let c = car4(g3, p3, gc[3])            // four level-1 nodes, down
        .concat(car4(g2, p2, gc[2]))
        .concat(car4(g1, p1, gc[1]))
        .concat(car4(g0, p0, gc[0]));

    let (gtop, ptop) = gp4(gG, pG);
    let cout = gtop || (ptop && cin);
    cout.as_uint().concat((x ^ y) ^ c)     // s_i = p_i xor c_i
}
```

`gG`/`pG` are the four upward 2-bit bundles in the diagram, packed one bit per group; `gc` is the four downward group carries, and `c` is the 16-bit vector of per-bit carries that the bit-level row XORs against $p$. The two `.as_uint()` on `[bool; 4]` rely on **element 0 being the LSB**, and integer `concat` puts its receiver in the **high** half — hence `c3.concat(c2)...`, the reverse of the array convention, which is exactly how a bit-reversed adder gets written by accident. Everything is a `fn`, so it is purely combinational: the four levels of the drawing are logic depth, not pipeline stages. Synthesis will not preserve the `gp4`/`car4` split — the shared product terms $p_3p_2$, $p_3p_2p_1$ appear in both and get factored once, which is precisely the "at no extra cost" claim of Eq. 5.24.

Simulated with iverilog: 5011 vectors — eleven directed, including $1+128$, $1+\text{0xFFFF}$ (a carry that must cross all four groups and both levels) and $1+\text{0xFFFE}+c_\text{in}$, plus 5000 random $(x,y,c_\text{in})$ against `x+y+cin`. No failures.

**Related notes.**

- [[CLA, Carry-Lookahead Adder]] – depends-on: supplies the flat block and the fan-in wall at $m=4$ that this note's second output climbs over.
- [[Parallel Prefix Adders]] – extends: names the operator composed here $\circ$, proves it associative, and turns "which tree" into a full design space.
- [[Brent-Kung Tree]] – compares: the $m=2$ case of the same reduce-then-distribute shape, drawn as a prefix graph instead of as blocks.
- [[Kogge-Stone Tree]] – compares: one-way $\lceil\log_2 w\rceil$ depth with no distribute phase, bought with $w\log_2 w$ nodes and long wires.
- [[Sklansky Tree]] – counter-example: same minimum depth, but fan-out $w/2$ instead of the bounded $m$ this structure holds.
- [[Conditional-Sum Adder]] – compares: $\log_2 w$ levels of simple nodes and a duplicated datapath, against $\log_m w$ levels of fat nodes and no duplication (p. 118).
- [[Carry-Select Adder]] – compares: the same $m$-bit blocking, resolved by speculation and a mux chain rather than by exporting group signals.
- [[RCA, Ripple-Carry Adder]] – counter-example: the $L=1$, $m=w$ degenerate tree, depth linear in $w$ with no group logic at all.
- [[Choosing an Adder]] – compares: where the round-trip constant stops paying for itself at small $w$.
- [[FPGA Hard Carry Chain Adder]] – counter-example: on FPGA the hardened linear chain beats every $\log w$ tree until the operands are hundreds of bits wide.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 5 "Fixed-Point Addition":

- §5.3.4 Carry-lookahead adder, p. 117 — Eqs. 5.18-5.23 (the unrolled recurrence), the fan-in objection, Fig. 5.14 (16-bit adder from chained CLA-4 groups, p. 117).
- §5.3.5 Recursive carry-lookahead adder, pp. 117-118 — Eq. 5.24 (group recurrence), Eqs. 5.25-5.27 ($m=4$ group pair), the $\log_m(w)$ level count, the comparison against the conditional-sum adder, and the "reparenthesizing" remark.
- §5.3.6 Parallel prefix adders, pp. 118-123 — Eqs. 5.35-5.43, the associativity proof of $\circ$ on $(g,a)$ pairs (p. 120) that the group composition above instantiates; fan-out discussion, p. 121.
- §5.2.2 Ripple-carry adder, pp. 106-109 — Eq. 5.11 ($s_i=p_i\oplus c_i$) and the delay model (5.7) this architecture is beating.

Tree construction details are delegated by the book to Ercegovac & Lang [EL04].
