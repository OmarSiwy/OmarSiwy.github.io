---
title: Oklobdzija LZC Tree
description: "Balanced binary tree over the associative operator (z,C): LZC(k+1) merges two LZC(k) with z=z_L AND z_R and a concatenation-select; O(log w_X) delay for about 2*w_X muxes, but the select drives a whole k-bit mux so fanout must be charged to the delay."
kind: circuit
source: "ASA §10.2.2.1, pp. 320-321"
status: seed
spade: simulated
tags: [digital, shifters, lzc, normalization, prefix]
aliases:
  - Oklobdzija's Recursive Construction
  - Oklobdzija Recursive LZC
  - Recursive LZC
  - LZC Tree
  - Logarithmic Leading Zero Counter
---

# Oklobdzija LZC Tree

A leading-zero counter built as a balanced binary tree over an associative chunk-merge operator, so its depth is $\log_2 w_X$ instead of the naive architecture's $\log^2 w_X$ — paid for with roughly double the multiplexer count and a select signal whose fanout grows with the level.

```tikz title="One merge node of Oklobdzija's recursive LZC: LZC(k+1) from two LZC(k)"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >=latex,
  blk/.style={draw,rounded corners=1.5pt,minimum width=30mm,minimum height=9mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
% ---- input fan-out -------------------------------------------------
\node at (0,5.75) {$X$};
\draw[->] (0,5.55) -- (0,5.1);
\node[w,anchor=west] at (0.12,5.35) {$w_X=2^{k+1}$};
\draw (-3.2,5.1) -- (3.2,5.1);
\draw[->] (-3.2,5.1) -- (-3.2,4.35);
\draw[->] ( 3.2,5.1) -- ( 3.2,4.35);
\node[w,anchor=east] at (-3.32,4.7) {$X_L$};
\node[w,anchor=west] at (-3.08,4.7) {$2^{k}$};
\node[w,anchor=west] at ( 3.32,4.7) {$X_R$};
\node[w,anchor=east] at ( 3.08,4.7) {$2^{k}$};

% ---- the two sub-counters -----------------------------------------
\node[blk] (L) at (-3.2,3.9) {$\mathrm{LZC}(k)$};
\node[blk] (R) at ( 3.2,3.9) {$\mathrm{LZC}(k)$};
\node[w,anchor=south west] at (-4.65,3.46) {$z$};
\node[w,anchor=south east] at (-1.75,3.46) {$C$};
\node[w,anchor=south west] at ( 1.75,3.46) {$z$};
\node[w,anchor=south east] at ( 4.65,3.46) {$C$};

% ---- z_L, z_R into the AND ----------------------------------------
\node[and port,xscale=-1] (A) at (-6.4,2.3) {};
\draw (-4.3,3.45) |- (A.in 1);
\draw (2.1,3.45) |- (A.in 2);
\node[w,anchor=east] at (-4.36,3.15) {$z_L$};
\node[w,anchor=west] at (2.16,3.15) {$z_R$};
\draw[->] (A.out) -- (-7.7,2.3) -- (-7.7,0.15);
\node[w] at (-7.7,-0.1) {$z$};

% ---- C_L, C_R into the multiplexer --------------------------------
\draw[->,line width=1pt] (-2.1,3.45) -- (-2.1,1.55);
\draw[->,line width=1pt] ( 4.3,3.45) -- ( 4.3,1.55);
\node[w,anchor=east] at (-2.16,2.6) {$C_L$};
\node[w,anchor=west] at (-2.04,2.6) {$k$};
\node[w,anchor=west] at ( 4.36,2.6) {$C_R$};
\node[w,anchor=east] at ( 4.24,2.6) {$k$};
\draw (-3.0,1.5) -- (5.2,1.5) -- (4.8,0.8) -- (-2.6,0.8) -- cycle;
\node[w,anchor=north] at (-2.1,1.46) {$0$};
\node[w,anchor=north] at ( 4.3,1.46) {$1$};

% ---- z_L drives both c_k and the select ---------------------------
\node[circ] at (-4.3,2.5) {};
\draw (-4.3,3.45) -- (-4.3,0.15);
\node[circ] at (-4.3,1.15) {};
\draw[->] (-4.3,1.15) -- (-2.83,1.15);
\draw[->] (-4.3,0.9) -- (-4.3,0.15);
\node[w] at (-4.3,-0.1) {$c_k$};

% ---- outputs -------------------------------------------------------
\draw[->,line width=1pt] (1.3,0.8) -- (1.3,0.15);
\node[w] at (1.3,-0.1) {$c_{k-1}\cdots c_0$};
\draw (-4.3,-0.4) -- (1.3,-0.4);
\draw (-4.3,-0.3) -- (-4.3,-0.4);
\draw (1.3,-0.3) -- (1.3,-0.4);
\draw[->,line width=1pt] (-1.5,-0.4) -- (-1.5,-1.05);
\node[w,anchor=west] at (-1.42,-0.72) {$k+1$};
\node[w] at (-1.5,-1.3) {$C$};
\end{circuitikz}
\end{document}
```

*After Fig. 10.11, p. 321.*

**Summarise a chunk by a pair, not by a count.** A leading-zero count does not compose: knowing $\mathrm{LZC}(X_L)$ and $\mathrm{LZC}(X_R)$ is not enough to recover $\mathrm{LZC}(X_LX_R)$, because the count of the left chunk is meaningless when that chunk is all zeroes and you cannot tell which case you are in from the count alone. The fix is to carry one extra bit. Summarise a chunk of $n$ bits by the pair $(z,C)$ where $z=1$ iff every bit of the chunk is zero, and $C$ is its leading-zero count, **defined only when $z=0$**. Carrying the width as well, the merge is

$$(z_L,C_L,n_L)\bullet(z_R,C_R,n_R)=\big(z_L\wedge z_R,\;\;z_L\,?\,(n_L+C_R):C_L,\;\;n_L+n_R\big)$$

**Associativity is what buys the tree, and its proof is one line.** Whatever the bracketing, the result of $\bullet$ over a sequence of chunks is the offset of the leftmost 1 in the concatenated chunk — and that offset is defined without reference to any bracketing, so all bracketings agree. The identity is the empty chunk $(1,\cdot,0)$. So an LZC is a reduction under an associative operator over $w_X$ single-bit leaves, exactly the situation of [[Parallel Prefix Adders]], and *therefore* a balanced binary tree evaluates it in $\lceil\log_2 w_X\rceil$ levels. The naive architecture of [[Leading Zero Counters]] is the fully unbalanced — i.e. linear — association of the very same operator. That is the whole difference between them.

**Equal power-of-two halves collapse the addition into a wire.** Oklobdzija's construction (p. 320) is that balanced tree specialised to $w_X=2^{k+1}$, so both halves are $n_L=n_R=2^k$ bits and $C_L,C_R$ are $k$ bits each. Then $n_L+C_R=2^k+C_R$ needs no adder at all: since $C_R<2^k$, the addend $2^k$ occupies a bit column that $C_R$ cannot reach, so the sum is the **concatenation** of a 1 in front of $C_R$. Symmetrically the $z_L=0$ branch is a 0 concatenated in front of $C_L$. Writing $0C$ and $1C$ for those concatenations,

$$z=z_L\wedge z_R \tag{10.2}$$
$$C=0C_L\ \text{ when }z_L=0,\qquad\text{else}\ \ 1C_R \tag{10.3}$$

so the MSB is just $c_k=z_L$ and the lower $k$ bits are a $k$-bit-wide 2:1 multiplexer selecting $C_L$ or $C_R$ under $z_L$. One merge node is therefore **one 2-input AND plus one $k$-bit-wide multiplexer**, and nothing else. $C$ leaves the node on $k+1$ bits, $z$ on one, feeding the next level up.

**The extra bit is a width argument, not a convenience.** $\mathrm{LZC}(k)$ takes $w_X=2^k$ bits — note this is $2^k$, not the $2^k-1$ of the naive architecture — and its $C$ has only $k$ bits, so $C$ can express counts $0$ through $2^k-1$ only. The one count it cannot hold is $2^k$, the all-zeroes case, and that is precisely the case $z$ flags. The recursion bottoms out at $\mathrm{LZC}(1)$: two input bits $x_1x_0$, one count bit, truth table $00\mapsto(z{=}1,c_0{=}0)$, $01\mapsto(0,1)$, $10\mapsto(0,0)$, $11\mapsto(0,0)$ — a handful of gates, and the level that would have been $\mathrm{LZC}(0)$ never exists.

> [!warning] The book's $C=0$ remark does not survive the recursion
> p. 320 states that with the $\mathrm{LZC}(1)$ truth table above "the architecture will output $C=0$ in the case where all the inputs are 0; therefore the $z$ bit of $\mathrm{LZC}(k)$ can also be interpreted as $c_k$." That holds at $k=1$ and fails from $k=2$ up. On an all-zero input every level has $z_L=1$, so (10.3) selects $1C_R$ and the count field obeys $C_k=2^{k-1}+C_{k-1}$ with $C_1=0$, i.e. $\boxed{C_k=2^k-2}$ — $2$ for $\mathrm{LZC}(2)$, $6$ for $\mathrm{LZC}(3)$, never $0$. Reading $z$ as $c_k$ would then give $2^{k+1}-2$ rather than the true count $2^k$. Confirmed on the RTL below: $\mathrm{LZC}(3)$ with $X=0$ emits $z=1,\ C=110_2$. Use $z$ as a **flag**, not as a count bit: $C$ is meaningful exactly when $z=0$.

**Count the multiplexers by recurrence, as with any tree.** Let $m_k$ be the number of bit-level 2:1 multiplexers inside $\mathrm{LZC}(k)$. A merge node adds a $k{+}1$-wide mux on top of two sub-trees — the diagram's mux is $k$ bits, plus the $c_k$ wire, and the book counts the full $k+1$ — giving $m_{k+1}=k+1+2m_k$ with $m_1=1$. The closed form is

$$m_k=2^{k+1}-k-2$$

checked by induction: $2(2^{k+1}-k-2)+(k+1)=2^{k+2}-k-3=2^{(k+1)+1}-(k+1)-2$. In terms of the input width $w_X=2^k$ this is $2w_X-\log_2 w_X-2$, i.e. **slightly under $2w_X$** — about twice the naive architecture's $w_X-w_C$ muxes. On top of that sits a binary tree of roughly $w_X$ two-input ANDs for $z$, which matches the combined cost of the naive architecture's wide NORs (p. 321). Area is still linear in $w_X$; only the constant doubles.

**Delay is one gate per level because a wide mux is one gate.** The $k$-bit multiplexer is $k$ independent bit slices driven by a common select, so all of them settle in a single gate delay; the AND for $z$ runs in parallel with it. Hence $d_{k+1}=d_k+1$ and $d_k=k=\log_2 w_X$ — genuinely logarithmic, against the naive $d_k=k(k+1)/2$.

**Then the model quietly lies, and the lie is fanout.** $z_L$ is the one signal that leaves the left sub-tree early and it drives three loads: the AND, the $c_k$ output wire, and — the expensive one — all $k$ bit slices of the multiplexer. Fanout at level $k$ is therefore $k+O(1)$, so it grows as $\log_2 w_X$, and unlike a one-off load it sits **on the critical path at every level of the tree**. The unit-delay-per-level model above charges nothing for it, so at large $w_X$ the measured delay pulls away from $\log_2 w_X$. This is the specific defect [[Monotonic String Leading Zero Counter]] exists to remove: routing the same associative reduction through a [[Kogge-Stone Tree]] prefix-OR caps fanout at 2 (p. 322).

**On FPGA, prefer the naive counter anyway.** The book is explicit that the $O(\log^2)$ naive LZC is the one to use on FPGAs (p. 320): its wide NORs map onto wide LUTs plus the fast carry chain rather than onto a gate tree, so their delay is far below the $\log$ of their width (p. 315), and it is the only variant that merges cleanly with a shifter into a [[Fused Normalizer]]. The Oklobdzija tree cannot be fused, because all its count bits appear simultaneously at the root and a left shifter wants them MSB-first, one per stage — there is nothing to overlap (p. 325). Its natural home is ASIC at large $w_X$.

$$\boxed{\ z=z_L\wedge z_R,\qquad C=\big(z_L\big)\;\Vert\;\big(z_L\,?\,C_R:C_L\big)\ }$$

with $C$ on $k+1$ bits, $C_L,C_R$ on $k$ bits, valid iff $z=0$; cost $m_k=2^{k+1}-k-2$ muxes and depth $k=\log_2 w_X$.

**When it breaks.**

- **$w_X$ must be a power of two.** The whole construction rests on $n_L+C_R$ degenerating to a concatenation, which needs $n_L=2^k$ exactly. Off-size inputs are padded up; pad on the **right with ones**, which makes $C$ saturate at $w_X$ rather than run off (p. 318–319). Padding with zeroes silently produces counts past $w_X$.
- **$C$ is garbage whenever $z=1$**, and per the warning above it is not even a *consistent* garbage of $0$. Any consumer that forgets to test $z$ gets $2^k-2$.
- **Fanout, at large $w_X$.** Once the select's $\log_2 w_X$ load starts showing up in timing reports, switch to [[Monotonic String Leading Zero Counter]] — same asymptotic depth, fanout $\le 2$, and it generalises to [[Leading Bit Counter]] and to [[Leading Zero Anticipation]], neither of which this form supports.
- **Anywhere a normalizer is wanted.** All count bits arriving at once is exactly the wrong arrival profile for fusing with a shifter; see [[Fused Normalizer]].
- **On FPGA at any practical width**, the asymptotics are the wrong guide — see the paragraph above.

**RTL (Spade).**

```spade
/// One merge node: two LZC(k) summaries into an LZC(k+1) summary.
/// (z, C) with C valid only when z is false. Eqs. (10.2)-(10.3), p. 320.
fn lzc_merge<#uint K>(l: (bool, uint<K>), r: (bool, uint<K>)) -> (bool, uint<{K + 1}>) {
    let (zl, cl) = l;
    let (zr, cr) = r;
    (zl && zr, zl.as_uint().concat(if zl { cr } else { cl }))
}

/// LZC(1): the two-bit leaf, exactly the truth table of Fig. 10.11.
fn lzc1(x: uint<2>) -> (bool, uint<1>) {
    let b = x.as_bits();
    (x == 0, (!b[1] && b[0]).as_uint())
}

/// LZC(3): balanced tree over 8 bits, three merge levels deep.
fn lzc8(x: uint<8>) -> (bool, uint<3>) {
    let b = x.as_bits();
    let n7 = lzc1(b[6..8].as_uint());
    let n5 = lzc1(b[4..6].as_uint());
    let n3 = lzc1(b[2..4].as_uint());
    let n1 = lzc1(b[0..2].as_uint());
    lzc_merge::<2>(lzc_merge::<1>(n7, n5), lzc_merge::<1>(n3, n1))
}
```

`zl.as_uint().concat(...)` **is** the diagram's $c_k$ wire: `concat` on integers puts its left operand in the high position, so the $z_L$ bit lands as the MSB of a $K+1$-bit result and the `if` beneath it is the $k$-bit multiplexer — the "free addition" of $2^k$ is literally a wire concatenation in the RTL, with no `+` anywhere in the datapath. `b[6..8]` is the *leftmost* pair of $X$ because `as_bits()` indexes from the LSB, which is the one place a bit-order slip would compile clean and count backwards. Everything is `fn`, hence purely combinational: `lzc8` is one cone of logic, no clock. Synthesis will not preserve the three-level shape — it flattens the whole cone and re-balances, so the $\log_2 w_X$ depth is a property of the Boolean function you handed it, not of the nesting you wrote.

Verified by exhaustive simulation over all 256 inputs plus 3000 random vectors, against a behavioural reference, through a wrapper flattening $(z,C)$ to the true count $0\ldots8$.

**Related Notes.**

- [[Leading Zero Counters]] – compares: the naive linear association of the same $\bullet$ operator, $O(\log^2 w_X)$ deep but half the muxes and FPGA-friendly.
- [[Parallel Prefix Adders]] – depends-on: the general "associative operator $\Rightarrow$ balanced tree in $\log n$ levels" argument this construction is an instance of.
- [[Kogge-Stone Tree]] – extends: the same tree idea applied to prefix-OR, which is how the fanout defect gets fixed.
- [[Brent-Kung Tree]] – compares: the other classic shape for the same reduction, trading depth for wire count and fanout.
- [[Monotonic String Leading Zero Counter]] – counter-example: same $O(\log_2 w_X)$ depth with fanout capped at 2, and it generalises where this one does not.
- [[Fused Normalizer]] – counter-example: simultaneous count bits make this tree the *worst* LZC to fuse with a shifter.
- [[Choosing a Shifter]] – compares: where this sits in the full shifter/LZC cost table.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §10.2.2.1 Oklobdzija's Recursive Construction, pp. 320–321 — Eqs. (10.2)–(10.3), Fig. 10.11 and the $\mathrm{LZC}(1)$ truth table, the $m_{k+1}=k+1+2m_k$ recurrence and the fanout caveat.
  - §10.2.1, pp. 318–320 — the naive architecture, its $d_k=k(k+1)/2$ delay, the ones-padding rule, and the FPGA recommendation.
  - §10.2.2.2, pp. 321–322 — monotonic string conversion, the fanout-2 alternative.
  - §10.3, p. 325 — why logarithmic LZCs cannot be fused with a shifter.
- Oklobdzija, "An algorithmic and novel design of a leading zero detector circuit", IEEE TVLSI 2(1), 1994 — cited as [Okl94], p. 320.

> [!warning] PDF page offset is +19 in this chapter, not +22
> Every printed page cited above was opened in `Dienchin.pdf` at printed page $+\,19$: PDF 340 renders printed 321 (Fig. 10.11), PDF 341 renders printed 322. Anyone re-checking these citations with the $+22$ offset will land three pages past the material.
