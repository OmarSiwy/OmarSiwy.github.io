---
title: "Remainder-Only BTCD"
description: "X mod D as a clean binary tree of 2r-input, r-output tables; the quotient-assembly logic disappears so both area and delay improve — the right circuit whenever only the residue is wanted."
kind: circuit
source: "ASA §13.3–13.4.2, pp. 434-437"
status: seed
spade: simulated
tags: [digital, division-by-constants, modulo, tree, fpga]
aliases:
  - BTCD/R
  - Remainder-Only Binary Tree Constant Divider
  - Remainder-Only Binary Tree Constant Division
  - Constant Modulo Tree
---

# Remainder-Only BTCD

Euclidean division by a small constant $D$ with the quotient thrown away, restructured from a chain into a balanced binary tree of $2r$-input, $r$-output tables — the only constant-division architecture whose delay is $O(\log w)$ *and* whose area is $O(w)$.

```tikz title="Remainder-only BTCD: 12-bit X mod 3 as a tree of 4-in, 2-out tables"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\footnotesize,
  tbl/.style={draw, thick, minimum width=15mm, minimum height=7mm}]
  % level 0: four 3-bit fields, each reduced by its own table
  \foreach \i/\x/\hi/\lo in {3/0/11/9, 2/3.4/8/6, 1/6.8/5/3, 0/10.2/2/0} {
    \node (X\i) at (\x,2.2) {$X_{\i}=x_{\hi..\lo}$};
    \node[tbl] (L\i) at (\x,1.0) {$\bmod\ 3$};
    \draw[->] (X\i) -- node[right] {$3$} (L\i.north);
  }
  % level 1: low child spans s=3, so c = 2^3 mod 3 = 2
  \node[tbl] (M1) at (1.7,-1.0) {$(2a{+}b)\bmod 3$};
  \node[tbl] (M0) at (8.5,-1.0) {$(2a{+}b)\bmod 3$};
  \draw[->] (L3.south) -- node[left,pos=0.6] {$2$} node[above right,pos=0.75,font=\scriptsize] {$a$} (M1.north west);
  \draw[->] (L2.south) -- node[right,pos=0.6] {$2$} node[above left,pos=0.75,font=\scriptsize] {$b$} (M1.north east);
  \draw[->] (L1.south) -- node[left,pos=0.6] {$2$} node[above right,pos=0.75,font=\scriptsize] {$a$} (M0.north west);
  \draw[->] (L0.south) -- node[right,pos=0.6] {$2$} node[above left,pos=0.75,font=\scriptsize] {$b$} (M0.north east);
  % root: low child spans s=6, so c = 2^6 mod 3 = 1
  \node[tbl] (RT) at (5.1,-3.0) {$(a{+}b)\bmod 3$};
  \draw[->] (M1.south) -- node[left,pos=0.6] {$2$} node[above right,pos=0.8,font=\scriptsize] {$a$} (RT.north west);
  \draw[->] (M0.south) -- node[right,pos=0.6] {$2$} node[above left,pos=0.8,font=\scriptsize] {$b$} (RT.north east);
  \draw[->] (RT.south) -- node[right] {$r=2$} (5.1,-4.2) node[below] {$R=X\bmod 3$};
  % level annotations
  \node[anchor=west,font=\scriptsize] at (12.0,1.0) {leaf tables: $3$ in, $r=2$ out};
  \node[anchor=west,font=\scriptsize] at (12.0,-1.0) {$s=3$: $c=2^{3}\bmod 3=2$};
  \node[anchor=west,font=\scriptsize] at (12.0,-3.0) {$s=6$: $c=2^{6}\bmod 3=1$};
  \node[anchor=west,font=\scriptsize] at (-1.6,3.2)
    {$X$ on $w=12$ bits, $D=3$, $r=2$. Every internal node: $2r=4$ bits in, $r=2$ bits out, depth $\lceil\log_2(w/3)\rceil=2$.};
\end{circuitikz}
\end{document}
```

**Start from the ring homomorphism, not from the digit recurrence.** [[LinArch Divider]] is a chain because its stage function needs the *previous* remainder before it can emit anything: $Y_i = X_i + 2^kR_{i+1}$ is a data dependency of length $m=\lceil w/k\rceil$. Reduction modulo $D$ has a property the Euclidean pair does not: the map $\pi:\mathbb{Z}\to\mathbb{Z}/D\mathbb{Z}$, $\pi(x)=x\bmod D$, is a **ring homomorphism**, so it commutes with both operations of the positional-value expression. Split $X$ on $w$ bits at any bit position $s$ into a high field $X_{\text{hi}}$ and a low field $X_{\text{lo}}$ of $s$ bits, so $X = X_{\text{hi}}\cdot 2^{s} + X_{\text{lo}}$. Applying $\pi$ and using that it preserves products and sums,

$$X \bmod D \;=\; \Bigl(\bigl(X_{\text{hi}}\bmod D\bigr)\cdot\bigl(2^{s}\bmod D\bigr) \;+\; \bigl(X_{\text{lo}}\bmod D\bigr)\Bigr)\bmod D$$

Nothing on the right needs a quotient, and neither field's reduction needs the other's answer. The dependency is no longer a chain; it is a fold over an operator whose two arguments are symmetric in availability — exactly the situation that turns a ripple-carry chain into a [[Kogge-Stone Tree]].

**Turn that identity into one table type.** Give every node a pair $\langle n, s\rangle$: the residue $n = V\bmod D$ of the field it covers, read as an integer with its own LSB at weight $1$, and the field's width $s$. The combining operator is

$$\langle n_{\text{hi}}, s_{\text{hi}}\rangle \oplus \langle n_{\text{lo}}, s_{\text{lo}}\rangle \;=\; \bigl\langle\, (n_{\text{hi}}\,2^{s_{\text{lo}}} + n_{\text{lo}}) \bmod D,\ s_{\text{hi}}+s_{\text{lo}} \,\bigr\rangle$$

$\oplus$ is **associative** — it is bit-field concatenation, which is associative, pushed through $\pi$ — so any bracketing of the $w$ input bits computes the same root value, and a *balanced* bracketing is legal. That is the whole architecture. Because the tree is balanced, every $s_{\text{lo}}$ is fixed at synthesis time, so the multiplier $c_\ell = 2^{s_\ell}\bmod D$ is a compile-time constant absorbed into the node's truth table and never appears as hardware. Each node reads two $r$-bit residues, $r = $ the bit width of $D-1$, and emits one: **$2r$ address bits in, $r$ bits out**, which is precisely the shape the book states for this variant. In the diagram, $D=3$ gives $r=2$ and two distinct node tables — $c_1 = 2^3\bmod 3 = 2$ and $c_2 = 2^6\bmod 3 = 1$ — one per level, not one per node.

**The quotient is what was forcing the chain.** A residue carries no positional weight: $\pi$ maps every field into the same $r$-bit set, so two residues merge into one residue and the intermediate values never grow. A quotient digit does carry weight. Each subtree's local quotient must be scaled by its position and *summed* with its siblings', and summation of weighted terms means carries, which means an adder tree or a prefix network on top of the residue tree — the quotient-assembly logic. That is where full BTCD's $\Theta(w\log w)$ area comes from, and deleting the quotient deletes it outright, leaving $2L-1$ tables for $L$ leaves and nothing else. Delay improves for the same reason: the residue tree's critical path is $\lceil\log_2 L\rceil + 1$ table lookups with no carry to propagate afterwards.

> [!note] Dropping $Q$ changes the *asymptotic class*, not just the constant
> Read Table 13.4 (p. 437) down the $D=3$ column at $w=32,64,128$. Full BTCD costs $95 \to 225 \to 517$ LUT — the $\Theta(w\log w)$ the book predicts, since $\tfrac{64\cdot 6}{32\cdot 5}=2.4$ and $\tfrac{225}{95}=2.37$. Remainder-only BTCD costs $12\to 25\to 50$ LUT: a clean doubling, i.e. $\Theta(w)$. The delay stays logarithmic throughout ($3.8 \to 4.8 \to 5.3$ ns). Every other entry in the chapter trades area against delay; this one is the single place where removing an output moves *both* to a better complexity class.

**Sizing it for an FPGA.** On a LUT$\alpha$ fabric ($\alpha\in[4,6]$, see [[FPGAs]]) the node is free-standing only while $2r \le \alpha$: then each of its $r$ output bits is one LUT$\alpha$ with $\alpha-2r$ inputs unused, and the node costs $r$ LUT$\alpha$. Above that threshold the same multiplexer-assembly argument as in LinArch reappears and a node costs $r\,2^{2r-\alpha}$ LUT$\alpha$. So the useful range is

$$2r \le \alpha \iff D \le 2^{\alpha/2},$$

which on a 6-LUT device means $D \le 8$ — **half the exponent LinArch tolerates**, because a node reads two residues where a LinArch stage reads one residue and one input chunk. $D=5$ sits exactly on the boundary ($r=3$, $2r=6=\alpha$), and that is why the book can report near-identical *area* for the two architectures at $D=5$: both build 6-input, 3-output LUTs, and both build about the same number of them. The leaves are the one place to spend the spare inputs — a leaf reduces a raw $\lambda$-bit input field, so take $\lambda=\alpha$, giving $L=\lceil w/\alpha\rceil$ leaves, $L-1$ internal nodes, and a depth of $1+\lceil\log_2 L\rceil$ lookups. In ASIC the constraint dissolves: table area is proportional to bits held, $2^{2r}r$ per node, and the leaf width is chosen against a delay target instead of a fixed $\alpha$.

**What it buys, measured.** From Table 13.4 (p. 437), Kintex-7, remainder-only columns: at $D=3$, $w=32$, LinArch is 11 LUT / 6.5 ns and BTCD is 12 LUT / 3.8 ns; at $w=128$ the same pair is 43 LUT / 27.2 ns against 50 LUT / 5.3 ns. At $D=5$, $w=32$, BTCD is *both* smaller and faster — 29 LUT / 3.7 ns against 30 LUT / 9.8 ns. The area is a wash at every width; the delay ratio grows without bound, because one side is linear in $w$ and the other logarithmic. There is no width at which remainder-only LinArch is the better choice on delay, and none at which it is meaningfully better on area.

> [!warning] Not covered in the source — needs outside research
> The book gives BTCD one paragraph (§13.3, p. 434) and one sentence for its remainder-only form (§13.4.2, p. 436), deferring the tree construction, the node function and the cost model to [Uğu+17]. The $\oplus$ operator above, the $2r\le\alpha$ threshold and the leaf/node counts are reconstructions that reproduce the architecture the book *describes* — a binary tree of $2r$-input, $r$-output tables — and are consistent with the measurements in Table 13.4, but they are not the paper's own model. No LUT count or delay figure in this note is anything other than a quotation from Table 13.4.

$$\boxed{\ \langle n_{\text{hi}},s_{\text{hi}}\rangle \oplus \langle n_{\text{lo}},s_{\text{lo}}\rangle = \bigl\langle (2^{s_{\text{lo}}}\!\!\bmod D)\,n_{\text{hi}} + n_{\text{lo}} \bmod D,\ s_{\text{hi}}{+}s_{\text{lo}}\bigr\rangle,\qquad 2r \to r \text{ bits}\ }$$

**When it breaks.**

- $2r > \alpha$. At $D=9$ ($r=4$) a node needs 8 address bits on a 6-LUT fabric and costs $r2^{2r-\alpha}=16$ LUT6; Table 13.5 duly shows atomic BTCD at $D=9$ costing 218 LUT against LinArch's 87. Factor the divisor first — see [[Composite Constant Divider]], whose sub-dividers are small enough to be BTCDs.
- You also want $Q$. Then this note does not apply: the assembly network comes back and with it the $\Theta(w\log w)$ area. Compare [[Binary Tree Constant Divider]] before assuming the remainder-only cost.
- Narrow $w$. At $w=8$, $D=3$ both architectures close at 3.6 ns; the tree only starts paying above roughly $w=16$, where the chain's linear delay overtakes $\log_2 w$ lookups.
- $D$ a power of two. $X \bmod 2^k$ is a wire cut. Never instantiate anything.
- Signed $X$. The homomorphism argument is over $\mathbb{Z}$; a two's-complement input needs its sign weight $-2^{w-1}$ folded into the top leaf's table, not a zero-extension — see [[Number Formats]].
- Deep trees are routing-bound. The LUT count above ignores interconnect, and at $w=128$ a tree of depth 6 spans the die where a chain stays local; the 5.3 ns figure is post-place-and-route, the model is not.

**RTL (Spade).** The 12-bit, $D=3$ tree of the diagram: one shared residue table and the two node types.

```spade
// residue table for D = 3: t mod 3, t in 0..7 — the leaf table, reused as the reducer
fn red3(t: uint<3>) -> uint<2> {
    match t {
        0 => 0, 1 => 1, 2 => 2,
        3 => 0, 4 => 1, 5 => 2,
        6 => 0, _ => 1,
    }
}

// tree node; low child spans s bits, c = 2^s mod 3
fn join_c1(a: uint<2>, b: uint<2>) -> uint<2> {     // c = 1, s even
    red3(trunc(a + b))
}

fn join_c2(a: uint<2>, b: uint<2>) -> uint<2> {     // c = 2, s odd
    let z: uint<1> = 0;
    let a2: uint<3> = a.concat(z);
    red3(trunc(a2 + zext::<2, 3>(b)))
}

entity btcd_mod3_12(x: uint<12>) -> uint<2> {
    let b = x.as_bits();
    // level 0: four 3-bit fields, each reduced by its own table
    let n0 = red3(b[0..3].as_uint());
    let n1 = red3(b[3..6].as_uint());
    let n2 = red3(b[6..9].as_uint());
    let n3 = red3(b[9..12].as_uint());
    // level 1: low child spans s = 3, so c = 2^3 mod 3 = 2
    let m0 = join_c2(n1, n0);
    let m1 = join_c2(n3, n2);
    // root: low child spans s = 6, so c = 2^6 mod 3 = 1
    join_c1(m1, m0)
}
```

`n3..n0` are the four leaf boxes, `m1`/`m0` the two $c=2$ nodes, and the returned value is the root's 2-bit $R$. The arithmetic inside `join_c2` — `concat` for $\times 2$, a widening `+`, then `trunc` back to 3 bits — is *not* hardware: $2a+b \le 6$ for $a,b\le 2$, so the expression is only a readable way to write a 4-input truth table, and synthesis will collapse each `join` into $r=2$ LUTs of 4 inputs exactly as drawn. Every path is combinational; a pipelined version cuts between levels, which is where the tree beats the chain again, since it has $\log_2 L$ cut points instead of $m$.

**Related notes.**

- [[Binary Tree Constant Divider]] – extends: the full Euclidean tree this is the stripped-down half of; its quotient network is what the remainder-only form deletes.
- [[Remainder-Only LinArch]] – compares: same output, same measured area, delay linear instead of logarithmic.
- [[Kogge-Stone Tree]] – supports: the identical move, reassociating a serial recurrence into a balanced tree because the combining operator is associative.
- [[Parallel Prefix Adders]] – compares: prefix adders must keep every prefix, so their trees are $O(w\log w)$; a remainder needs only the root, so this one is $O(w)$.
- [[Compressor Trees]] – counter-example: another tree-shaped reduction, but one whose nodes reduce *weighted* bits and therefore cannot collapse to a fixed-width residue.
- [[Composite Constant Divider]] – depends-on: the escape route once $2r>\alpha$ makes a single tree unaffordable.
- [[Choosing a Constant Divider]] – compares: where this sits against every sibling architecture.
- [[Constant Division Digit Table]] – supports: the leaf table here is the same object, addressed by a raw input field instead of a remainder-and-chunk pair.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 13:

- §13.3 Parallel division — BTCD is to LinArch what fast adders are to carry-propagate adders; latency $\log w$, area $w\log w$ — p. 434
- §13.4.2 Remainder-only variant of LinArch and BTCD — "a binary tree of tables that have $2r$ inputs and $r$ outputs" — p. 436
- Table 13.4, remainder-only (R) versus Euclidean (Q+R) for LinArch and BTCD, Kintex-7, $D\in\{3,5\}$, $w\in\{8,\dots,128\}$ — p. 437
- §13.2.5 FPGA-specific remarks, the LUT$\alpha$ assembly cost $2^{r+k-\alpha}$ adapted here to $2^{2r-\alpha}$ — p. 434
- Table 13.5, atomic BTCD at $D=9$ and $D=15$ — p. 440

Primary source for the architecture: [Uğu+16], [Uğu+17] H. F. Uğurdağ, F. de Dinechin, Y. S. Gener, S. Gören & L.-S. Didier, "Hardware division by small integer constants", *IEEE Trans. Computers* 66.12 (2017), pp. 2097–2110.
