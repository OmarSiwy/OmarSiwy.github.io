---
title: Binary Tree Comparator
description: "Divide-and-conquer comparison carrying a (greater, equal) pair per edge — the same prefix operator as the adder's (g,p), at log-depth with no leaf logic."
kind: circuit
source: "ASA §6.2 and Table 6.1, pp. 146-147"
status: seed
spade: simulated
tags: [digital, comparators, prefix, tree, fpga]
aliases:
  - Tree Comparator
  - Binary Tree Comparison
  - Basic Binary Tree Comparison
  - Divide-and-Conquer Comparator
---

# Binary Tree Comparator

A comparator that splits both operands in half, compares the halves independently, and merges the two verdicts with one associative operator — reducing the depth from $w$ to $\lceil\log_2 w\rceil$ at the price of two bits on every wire instead of one.

```tikz title="w=8 binary tree comparator: raw bit pairs at the leaves, a (G,E) code on every edge"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- leaves: raw bit pairs, no logic at all ---
  \foreach \i/\x in {7/0, 6/1.5, 5/3.0, 4/4.5, 3/6.0, 2/7.5, 1/9.0, 0/10.5}{
    \node[font=\small] (b\i) at (\x,0) {$(x_{\i},y_{\i})$};
  }
  \node[font=\tiny,anchor=north] at (5.25,-0.55)
    {leaf code = the input wires themselves: $10$ is $>$, $01$ is $<$, $00$ and $11$ are both $=$};

  % --- level 1 ---
  \foreach \n/\x in {0/0.75, 1/3.75, 2/6.75, 3/9.75}{
    \node[draw,circle,inner sep=2pt] (a\n) at (\x,1.5) {$\circ$};
  }
  \foreach \s/\t in {b7/a0, b6/a0, b5/a1, b4/a1, b3/a2, b2/a2, b1/a3, b0/a3}{
    \draw[->] (\s) -- (\t);
  }
  \node[font=\tiny,anchor=east] at (0.3,0.8) {2};

  % --- level 2 ---
  \foreach \n/\x in {0/2.25, 1/8.25}{
    \node[draw,circle,inner sep=2pt] (c\n) at (\x,3.0) {$\circ$};
  }
  \foreach \s/\t in {a0/c0, a1/c0, a2/c1, a3/c1}{
    \draw[->] (\s) -- (\t);
  }
  \node[font=\tiny,anchor=east] at (1.35,2.3) {2};

  % --- root ---
  \node[draw,circle,inner sep=2pt] (r) at (5.25,4.5) {$\circ$};
  \draw[->] (c0) -- node[pos=0.55,above,font=\tiny]{$H$} (r);
  \draw[->] (c1) -- node[pos=0.55,above,font=\tiny]{$L$} (r);
  \draw[->] (r) -- (5.25,5.6);
  \node[anchor=west,font=\small] at (5.45,5.5) {$(G,E)$};
  \node[anchor=west,font=\tiny] at (5.45,5.05) {$G=[X>Y]$, $E=[X=Y]$, $[X<Y]=\overline{G\vee E}$};

  % --- the node operator ---
  \node[draw,anchor=west,align=left,font=\small,inner sep=4pt] at (-0.3,5.3)
    {$\circ$ node\\[1pt]
     $\scriptstyle G_{H:L}=G_H\vee(E_H\wedge G_L)$\\
     $\scriptstyle E_{H:L}=E_H\wedge E_L$};

  \node[font=\tiny,anchor=west,align=left] at (-0.5,3.7)
    {$\lceil\log_2 w\rceil$ levels, $w-1$ nodes,\\ 2 bits on every edge};

\end{circuitikz}
\end{document}
```

*after Table 6.1, p. 147*

**Split the word and the case analysis collapses to two lines.** Let $k=\lceil w/2\rceil$ and write the $w$-bit unsigned inputs as $X=2^kX_H+X_L$, $Y=2^kY_H+Y_L$, with $X_L,Y_L$ the low $k$ bits and $X_H,Y_H$ the high $w-k$. Then

$$X-Y \;=\; 2^k\,(X_H-Y_H) \;+\; (X_L-Y_L).$$

Because both low halves are $k$-bit unsigned, $|X_L-Y_L| \le 2^k-1 < 2^k$, while $X_H\ne Y_H$ forces $|2^k(X_H-Y_H)|\ge 2^k$. The high term therefore *dominates* whenever it is non-zero, so the sign of $X-Y$ is the sign of $X_H-Y_H$ unless $X_H=Y_H$, in which case the high term vanishes and the sign is that of $X_L-Y_L$. This is lexicographic order, and it is the whole content of Table 6.1 (p. 147):

| $X$ cmp $Y$ | $X_H<Y_H$ | $X_H=Y_H$ | $X_H>Y_H$ |
| --- | --- | --- | --- |
| $X_L<Y_L$ | $X<Y$ | $X<Y$ | $X>Y$ |
| $X_L=Y_L$ | $X<Y$ | $X=Y$ | $X>Y$ |
| $X_L>Y_L$ | $X<Y$ | $X>Y$ | $X>Y$ |

Two of the three columns are constant. Only the middle one consults the low half — which is exactly what makes the table a *merge rule* rather than a $3\times3$ decoder, and what lets the same rule apply recursively to $X_H,Y_H$ and to $X_L,Y_L$ until the halves are single bits.

**Encode a window's verdict in two bits and the merge rule becomes algebra.** Three mutually exclusive outcomes need $\lceil\log_2 3\rceil = 2$ bits. Take the pair $(G,E)$ with $G=[X>Y]$ and $E=[X=Y]$, both 1 bit, so $[X<Y]=\overline{G\vee E}$ comes free by exhaustiveness. Read Table 6.1 column by column: the output is $>$ when the high half says $>$, or when the high half says $=$ and the low half says $>$; the output is $=$ only when both halves say $=$. Written out, and using nothing but the definition of the table,

$$G_{H:L}=G_H \vee (E_H \wedge G_L),\qquad E_{H:L}=E_H \wedge E_L .$$

Every edge of the tree carries these 2 bits no matter how wide the window beneath it is — a subtree spanning 32 operand bits emits the same 2 wires as a subtree spanning 2. That compression from $2w$ input bits to 2 is the entire reason the recursion terminates in $\lceil\log_2 w\rceil$ levels.

> [!note] The pair is the adder's $(g,p)$, not merely analogous to it
> Instantiate an adder on $X+\overline{Y}+1$ — the two's-complement identity $-Y=\overline{Y}+1$ from [[Number Formats]] makes its carry-out the bit $[X\ge Y]$. Its per-bit signals come out as $g_i=x_i\wedge\overline{y_i}=[x_i>y_i]$ and $p_i=x_i\oplus\overline{y_i}=\overline{x_i\oplus y_i}=[x_i=y_i]$, literally $G_i$ and $E_i$, and its block recurrence $g_{H:L}=g_H\vee(p_H\wedge g_L)$, $p_{H:L}=p_H\wedge p_L$ is the two lines above with the letters changed. **Generate is "this window decides, and it says greater"; propagate is "this window abstains."** So $\circ$ is the prefix operator of [[Parallel Prefix Adders]] and is associative for the same reason — do not re-derive it here.

**Associativity buys freedom of shape, but a comparator needs less of it than an adder does.** Since $\circ$ is associative, any bracketing of $(G_{w-1},E_{w-1})\circ\cdots\circ(G_0,E_0)$ gives the same root, so the split need not be at the midpoint and the tree need not be balanced. An adder exploits that freedom to compute *all* $w$ prefixes at once, which is why [[Kogge-Stone Tree]] duplicates nodes for depth, [[Brent-Kung Tree]] recombines them for area, and [[Sklansky Tree]] trades fanout against both. A comparator wants **one** value, the full reduction — so a plain balanced binary tree is simultaneously depth-optimal and node-optimal at $\lceil\log_2 w\rceil$ levels and $w-1$ nodes, and the prefix topologies have nothing left to offer. Reach for them only when the surrounding design also wants the intermediate prefixes, e.g. a comparison fused into an [[Adders|adder]] that must produce the difference anyway.

**Choose the encoding so the leaves cost nothing.** A leaf compares two single bits $x_i,y_i$; in the $(G,E)$ code that costs $G_i=x_i\wedge\overline{y_i}$ and $E_i=\overline{x_i\oplus y_i}$, an AND and an XNOR per bit. The book's choice (p. 147) is to keep the *other* natural pair, $(g,\ell)=([X>Y],[X<Y])$, in which $x_i>y_i$ is $10$, $x_i<y_i$ is $01$ and $x_i=y_i$ is $00$ **or** $11$: the leaf code is then the pair of input wires itself, and no leaf gate exists at all. Decoding a possibly-redundant code costs nothing extra because the node already needs the same three terms —

$$G = g\wedge\overline{\ell},\qquad L = \overline{g}\wedge\ell,\qquad E = \overline{g\oplus\ell}$$

by *definition of the code* plus, for $E$, the observation that $g=\ell$ is exactly the two equality patterns $00$ and $11$. Substituting into the merge rule gives one uniform node, applied identically at every level:

$$g_{H:L}=G_H\vee(E_H\wedge G_L),\qquad \ell_{H:L}=L_H\vee(E_H\wedge L_L)$$

and its output is never $11$: if $g_{H:L}=1$ then either $G_H=1$, which forces $L_H=0$ and hence $\ell_{H:L}=0$, or $E_H\wedge G_L=1$, which forces $L_H=L_L=0$ and again $\ell_{H:L}=0$. **The redundancy therefore exists only on the leaf edges and is consumed by the first level of nodes**, which are 4-input Boolean functions of $(x_{i+1},y_{i+1},x_i,y_i)$ — one LUT-4 pair on FPGA ([[Lookup-Tables]]), where the leaf logic disappears into a LUT that was going to be spent regardless. On ASIC the saving is smaller: the leaf gates are absorbed into the first level's gate cone rather than deleted.

**Count the cost from the recurrence, since the chapter gives none.** In the $(G,E)$ form each node is one AND and one OR on the $G$ path and one AND on the $E$ path: 3 two-input gates, $3(w-1)$ for the tree, plus $2w$ leaf gates if the non-redundant code is used and $0$ if the redundant one is. Depth is $\lceil\log_2 w\rceil$ nodes and the $G$ path is 2 gates deep per node, so the critical path is $2\lceil\log_2 w\rceil$ two-input gate delays — against $2w$ for the same recurrence evaluated as a ripple. Asymptotically this is the same $O(w)$ area and $O(\log w)$ delay as taking the carry-out of a prefix adder on $X+\overline{Y}+1$; the tree's advantage is that it never builds the $w$ sum bits it would throw away.

**Asking for only one of the three outputs does not always buy a cheaper tree.** If only $X=Y$ is wanted, the recurrence loses its first line entirely: $E_{H:L}=E_H\wedge E_L$ alone, one bit per edge, and the tree degenerates into $w$ XNORs feeding a balanced AND tree of depth $\lceil\log_2 w\rceil$ — the [[Equality Comparator]], reached here as a special case rather than as a separate idea. If only $X<Y$ is wanted there is **no** corresponding collapse: with the exception of the root, every node must still distinguish $X_H<Y_H$, $X_H=Y_H$ and $X_H>Y_H$, because a node cannot know whether it will end up being consulted, and three cases need two bits. Only the root may drop a bit.

**On FPGA the asymptotics are real and irrelevant.** Each edge of this tree is a 2-bit signal crossing general routing between two LUTs, and on every modern device the dedicated carry chain is fast enough that a $\lceil w/2\rceil$-long ripple beats a $\lceil\log_2 w\rceil$-deep tree for all sizes up to about 64 bits, and stays more area-efficient at every practical size (p. 149) — see [[Fast Carry Chain Comparator]]. The tree returns only in the two-level hybrid, where the *chunks* are compared in parallel and their $(g,\ell)$ codes assembled into synthetic operands for a second carry comparison ([[Two-Level Fast Carry Comparator]]): that is this same $\circ$ applied one level up, with the fabric providing the reduction inside each level. A LUT-6 also makes a ternary node natural, taking three 2-bit codes at once and cutting the depth to $\lceil\log_3 w\rceil$ at the same node count. On ASIC, where a 2-bit wire is just two wires, the plain binary tree is the answer.

$$\boxed{\;G_{H:L}=G_H \vee (E_H \wedge G_L),\qquad E_{H:L}=E_H \wedge E_L\;}$$

> [!warning] No measured area or delay in Chapter 6
> The chapter states the construction and the FPGA crossovers but gives no gate counts, no LUT counts and no delays for the tree itself. The $3(w-1)$ gates and $2\lceil\log_2 w\rceil$ levels above are derived from the recurrence by counting, on the two-input-gate model; a real technology mapping will differ, and anything more precise needs outside research.

**When it breaks**

- **$w=1$.** The tree is empty and the "leaf code" is the output. Nothing is wrong, but a generator that assumes at least one node will divide by zero here.
- **Logic depth is not delay.** $\lceil\log_2 w\rceil$ counts gate levels; the root's two inputs come from opposite ends of a $w$-bit word, so wire length — and, on FPGA, routing hops — still grows with $w$. The tree flattens the logic, not the floorplan.
- **On FPGA it essentially always loses.** Not asymptotically, but for every $w$ anyone builds. The dedicated carry path is the sibling that takes over, and it is also what synthesis emits by default.
- **Signed operands need a fix-up first.** Two's-complement operands compare as unsigned after exchanging their MSBs — a wire crossing, no logic, but omitting it silently inverts the verdict for operands of opposite sign ([[Two's-Complement Comparator]]).
- **A constant operand changes which resource binds.** The tree does prune — every leaf against a constant bit collapses to a wire or an inverter — but the real win moves to LUT packing, not gate count ([[Constant Comparator]]).
- **If the difference $X-Y$ is needed anyway, the tree is pure overhead.** Subtract and read the sign; the ordering is a by-product of hardware you already paid for.

**RTL (Spade)**

```spade
fn cmp_node(hi: (bool, bool), lo: (bool, bool)) -> (bool, bool) {
    let (gh, eh) = hi;
    let (gl, el) = lo;
    (gh || (eh && gl), eh && el)
}

fn cmp_tree<#uint W>(x: [bool; W], y: [bool; W]) -> (bool, bool) {
    gen if W == 1 {
        (x[0] && !y[0], x[0] == y[0])
    } else {
        let (xl, xh) = x.split_at::<{W / 2}>();
        let (yl, yh) = y.split_at::<{W / 2}>();
        cmp_node(cmp_tree(xh, yh), cmp_tree(xl, yl))
    }
}
```

The `(bool, bool)` return is the 2-bit edge of the diagram, $(G,E)$ in that order, and `cmp_node` is one $\circ$ circle. `gen if` is a *compile-time* branch, so the recursion is unrolled at elaboration into $W-1$ real node instances — there is no loop and no state; both items are `fn`, not `entity`, because the block is purely combinational. Element 0 of an `[bool; W]` is the LSB, so `split_at::<{W/2}>` returns the **low** half first, which is why `xh`/`yh` are the second component and are passed as the `hi` argument; swapping them compiles cleanly and is exactly the bug the asymmetric simulation vectors below exist to catch. Odd `W` splits $\lfloor W/2\rfloor$ low against $\lceil W/2\rceil$ high, the mirror image of the book's $k=\lceil w/2\rceil$; associativity makes the two equivalent, and only the balance matters. Synthesis will not preserve this shape — it will flatten the $\circ$ cones and re-map them into LUTs, or onto the carry chain, as the paragraph above predicts.

Verified with an 8-bit wrapper `entity cmp8(x: uint<8>, y: uint<8>) -> uint<2>` that forces monomorphisation and packs $(G,E)$ into one port, then simulated against a behavioural reference on 10 named vectors (including $1$ vs $128$ and $16$ vs $15$, where the high half must override a larger low half), a 3000-vector random sweep, and an exhaustive 65536-pair sweep: 68546 vectors, zero mismatches.

**Related Notes**

- [[Parallel Prefix Adders]] – depends-on: the associativity of $\circ$, and the $(g,p)$ pair this note's $(G,E)$ turns out to be.
- [[Kogge-Stone Tree]] – compares: minimum depth when *all* prefixes are wanted; a comparator wants only the root, so the extra nodes buy nothing.
- [[Brent-Kung Tree]] – compares: the area-side prefix topology, likewise unnecessary for a single reduction.
- [[Sklansky Tree]] – compares: same reduction with worse fanout at the root, which is where a comparator's delay actually lands.
- [[Equality Comparator]] – extends: this tree with the $G$ line deleted, one bit per edge.
- [[Fast Carry Chain Comparator]] – counter-example: on FPGA the asymptotics reverse, and the ripple beats the tree at every practical width.
- [[Two-Level Fast Carry Comparator]] – extends: the same $\circ$ applied one level up, with a carry chain doing each level's reduction.
- [[Magnitude Comparator]] – supports: the ordering predicates the tree's root produces, and how the other three are obtained from them.
- [[Two's-Complement Comparator]] – depends-on: the MSB exchange that must precede this tree for signed operands.
- [[Constant Comparator]] – extends: what the tree becomes when one operand is frozen.
- [[Choosing a Comparator]] – compares: where this sits against every sibling.
- [[Adders]] – supports: the carry recurrence and the subtraction $X+\overline{Y}+1$ this construction is a renaming of.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 6 "Fixed-Point Comparison".
  - Sect. 6.1.2 Area and Delay Considerations, p. 146 — the two baselines (AND tree of XNORs for equality; carry-out of $X-Y$ for ordering).
  - Sect. 6.2 Basic Binary Tree Comparison and Table 6.1, pp. 146–147 — the split, the case table, the two-bit encoding and the logic-free leaves.
  - Sect. 6.3.1–6.3.3, pp. 148–149 — the FPGA comparison the "asymptotics are irrelevant" paragraph draws on, including the 64-bit latency crossover and the ternary LUT-6 tree.
- [[2.2) Comparators]] — §Area and delay considerations, §The basic binary tree comparator, §Trade-offs (the dedicated-tree row).
