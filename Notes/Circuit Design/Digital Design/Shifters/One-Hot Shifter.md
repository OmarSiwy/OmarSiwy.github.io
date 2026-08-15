---
title: "One-Hot Shifter"
description: "One (S_max+1):1 mux per output bit driven by a one-hot decode of S: same asymptotic depth as a barrel shifter but quadratic area and fanout S_max on every input bit, so it loses above trivial widths."
kind: circuit
source: "ASA §10.1.4, pp. 314-315 (structure derived; the book documents only the staged barrel shifter)"
status: seed
spade: simulated
tags: [digital, shifters, multiplexer, decoder, fpga]
aliases:
  - One-Hot Shifters
  - Mux-per-Position Shifter
  - Decoded Shifter
---

# One-Hot Shifter

Decode the shift distance once into a one-hot vector and realise the entire shift as a single flat AND-OR array — one $(S_{\max}{+}1)$:1 multiplexer per output bit — instead of the $\lceil\log_2(S_{\max}{+}1)\rceil$ successive rows of 2:1 multiplexers a [[Barrel Shifters|barrel shifter]] uses.

```tikz title="4-bit right one-hot shifter: 2:4 decoder feeding a triangular AND-OR array"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize,
  >={Latex[length=1.6mm]},
  cell/.style={draw,fill=black!8,rounded corners=1pt,minimum width=7mm,minimum height=5mm,inner sep=1pt},
  orb/.style={draw,fill=black!3,rounded corners=1pt,minimum width=11mm,minimum height=5.5mm,inner sep=1pt},
  dec/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=62mm,minimum height=7mm,inner sep=2pt},
  xline/.style={densely dashed,black!55},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
% --- decoder: S -> one-hot D ---
\node[dec] (D) at (3.6,7.1) {$w_S{:}2^{w_S}$ decoder \ ($2{:}4$)};
\draw[->] (-1.7,7.1) -- node[w,above]{$S$, $2$} (D.west);
\foreach \x/\k in {0.9/0, 2.7/1, 4.5/2, 6.3/3}{
  \draw (\x,6.75) -- (\x,0.4);
  \node[w,anchor=west] at (\x+0.08,6.52) {$d_{\k}$};
}
% --- one dashed diagonal per input bit: its fan-out ---
\draw[xline] (-0.9,6.4) -- (6.3,0.4);   \node[w] at (-1.2,6.4) {$x_3$};
\draw[xline] (-0.9,4.9) -- (4.5,0.4);   \node[w] at (-1.2,4.9) {$x_2$};
\draw[xline] (-0.9,3.4) -- (2.7,0.4);   \node[w] at (-1.2,3.4) {$x_1$};
\draw[xline] (-0.9,1.9) -- (0.9,0.4);   \node[w] at (-1.2,1.9) {$x_0$};
% --- AND array: cell (i,k) exists iff i+k <= 3 ---
\foreach \y/\i/\n in {4.9/3/1, 3.4/2/2, 1.9/1/3, 0.4/0/4}{
  \foreach \x in {0,...,\the\numexpr\n-1\relax}{
    \node[cell] at ({0.9+1.8*\x},\y) {$\wedge$};
    \draw ({0.9+1.8*\x+0.35},\y+0.25) -- ({0.9+1.8*\x+0.35},\y+0.45);
    \fill ({0.9+1.8*\x+0.35},\y+0.45) circle (1.1pt);
  }
  \draw (1.25,\y+0.45) -- (7.85,\y+0.45);
  \node[orb] (o\i) at (8.4,\y+0.45) {OR$_{\n}$};
  \draw[->] (o\i.east) -- node[w,above]{$r_{\i}$} (9.6,\y+0.45);
}
\node[w,anchor=west,align=left] at (-1.7,-0.75)
  {$w_X=w_R=4$, $S_{\max}=3$, $w_S=2$. Cell $(i,k)$ computes $d_k\wedge x_{i+k}$ and exists only when $i+k<4$;\\
   $D=d_3d_2d_1d_0$ is one-hot on $4$ bits; $R=r_3r_2r_1r_0$ on $4$ bits. Depth: decoder $+$ 1 AND $+$ $\lceil\log_2 4\rceil$ OR.};
\end{circuitikz}
\end{document}
```

> [!warning] Not covered in the source — no cost model in the book
> §10.1.4 (p. 314) is three sentences and defines only the staged barrel shifter, $w_R=w_X$. The book never presents the flat variant. Every gate count, depth and fanout figure below is derived here — as is the "naive mux-per-position" row of the trade-off table in [[Shifters]], which is explicitly marked *derived, not in the book*. Treat the crossover width as something to measure on your own library, not as a quoted result.

**Read the shift as a selection rather than as a composition.** The barrel shifter comes from factoring $\sigma^S=\prod_i\sigma^{s_i2^i}$ and spending one mux row per bit of $S$. The dual reading throws the algebra away and looks at the function pointwise: for a right shift with zero padding, output bit $r_i$ of $R$ ($w_R$ bits) is literally $x_{i+S}$, an *index* into $X$ ($w_X$ bits) controlled by $S$ ($w_S=\lceil\log_2(S_{\max}+1)\rceil$ bits). Indexing a vector by a runtime value is the definition of a multiplexer, so each of the $w_R$ output bits is one $(S_{\max}{+}1)$:1 multiplexer whose data inputs are a contiguous window of $X$ and whose select is $S$ itself.

**Decoding the select turns one wide multiplexer into two gate levels.** A $(S_{\max}{+}1)$:1 multiplexer driven by a *binary* select is internally a tree of 2:1 multiplexers, $\lceil\log_2(S_{\max}+1)\rceil$ deep — which is exactly the barrel shifter again, just replicated per bit instead of shared. The one-hot form removes that tree. Let $D=d_{S_{\max}}\ldots d_0$ on $S_{\max}+1$ bits with $d_k=[\,S=k\,]$, produced by a $w_S$-to-$2^{w_S}$ [[Decoders|decoder]]. The decoder output is a *partition of unity*: $\bigvee_k d_k=1$ and $d_j\wedge d_k=0$ for $j\ne k$. Multiply the mux's defining case analysis by that partition and distribute AND over OR:

$$r_i=\bigvee_{k=0}^{S_{\max}}\big(d_k\wedge x_{i+k}\big)$$

Exactly one term is non-zero, so the OR is a select, not a sum — no carry, no ordering, and by **associativity and commutativity of OR** the reduction may be balanced into any tree.

**Zero padding makes the array triangular, not rectangular.** For a truncated shifter with $w_X=w_R=n$ and $S_{\max}=n-1$, $x_{i+k}$ only exists when $i+k\le n-1$; beyond that the shifted-in bit is the constant $0$ and the AND cell collapses to nothing. Cell $(i,k)$ therefore exists iff $i+k<n$, giving

$$\#\text{AND}=\sum_{i=0}^{n-1}(n-i)=\frac{n(n+1)}{2},\qquad \#\text{OR inputs}=\text{same}$$

Counted instead in 2:1-multiplexer equivalents — an $m$:1 mux is $m-1$ of them — the same array is $n(n-1)$, which is the number quoted in the trade-off table of [[Shifters]]. Either way it is $\Theta(n^2)$ against the barrel shifter's $n\lceil\log_2 n\rceil$: at $n=16$, $120$ AND cells (or $240$ mux-equivalents) versus $64$ muxes.

**On paper the depth is better, under the book's cost model it is worse, and both statements are honest.** Count a multiplexer as one gate delay, as the book does when it evaluates LZC delay (p. 319, footnote 4): the barrel shifter is $\lceil\log_2(S_{\max}+1)\rceil$ deep, the one-hot form is $1$ (decoder minterm) $+\,1$ (AND row) $+\lceil\log_2(S_{\max}+1)\rceil$ (OR tree), strictly worse by a constant $2$. Count in 2-input gates instead: a 2:1 mux is roughly two levels, so the barrel shifter costs $\approx 2\lceil\log_2(S_{\max}+1)\rceil$ while the one-hot form costs $\approx\lceil\log_2 w_S\rceil+1+\lceil\log_2(S_{\max}+1)\rceil$ — nearly a factor of two better. That is the whole seduction of the architecture, and it is why it keeps getting reinvented. The $\log$ term never goes away in either model, so there is no asymptotic depth to win.

**What kills it is data fanout, which no gate count shows.** In a barrel shifter every intermediate bit feeds exactly two multiplexer inputs in the next stage — a constant load, independent of $n$. Here bit $x_j$ appears in every cell with $i+k=j$, that is $j+1$ of them, so the MSB is loaded by $n$ gate inputs; symmetrically $d_k$ drives $n-k$ cells and $d_0$ is loaded by $n$. $X$ typically arrives from a register file or an adder output some distance away, and charging every one of its bits with $S_{\max}+1$ gate loads means buffering that is paid back out of the depth advantage just derived. The wiring is worse than the loading: the array needs $\Theta(n^2)$ crossings where the barrel shifter needs $\Theta(n\log n)$, and above a few tens of bits a datapath is routing-bound, not gate-bound.

**On FPGAs the gap widens rather than closing.** A 6-input [[Lookup-Tables|LUT]] holds a 4:1 multiplexer, so two successive barrel-shifter rows merge into one LUT level: $\tfrac12 n\log_2 n$ LUTs at depth $\tfrac12\log_2 n$ (p. 314). A flat AND-OR array has no such structure to merge — a 2-input AND cell wastes a 6-LUT almost entirely, and only the wide OR is cheap, because a wide OR maps onto the fast carry chain rather than a gate tree (p. 315). In practice the question is moot: given a behavioural shift, back-end tools infer the staged mux tree regardless of how the source is written. The one place the one-hot decode is *not* wasted on an FPGA is [[Shift by Multiplier]] — there $D$ is precisely the operand $2^S$ fed to a DSP multiplier, and the AND-OR array is the multiplier's own partial-product array, already built in silicon.

$$\boxed{\ r_i=\bigvee_{k=0}^{S_{\max}}\big(d_k\wedge x_{i+k}\big),\quad d_k=[\,S=k\,]\ \ \Longrightarrow\ \ \tfrac12 n(n{+}1)\ \text{AND cells},\ \ \text{depth}=2+\lceil\log_2(S_{\max}{+}1)\rceil\ }$$

for the barrel case $w_X=w_R=n$, $S_{\max}=n-1$, against $n\lceil\log_2 n\rceil$ muxes at depth $\lceil\log_2 n\rceil$.

## When it breaks

- **Above trivial widths.** The $\Theta(n^2)$ cells, the $\Theta(n)$ load on every bit of $X$ and the $\Theta(n^2)$ routing all fire at once; [[Barrel Shifters]] takes over well before $n=16$.
- **Exact full shifters.** With $w_R=w_X+S_{\max}$ the triangle becomes a band — every output row has a full $w_X$-wide window — so the count is $w_X(S_{\max}+1)$ cells with no savings from padding, and the [[Exact Full Shifter]]'s narrow early stages have no analogue.
- **Sticky bits are unavailable.** The early-sticky construction of [[Shifter with Sticky Bit Computation]] works because stage $j$ discards a known set $\mathcal{D}_j$ and can OR it locally. A flat array has no stages, so $\sigma$ must be a separate decoded wide OR over $\{x_0,\ldots,x_{S-1}\}$ — the exact serial cost the staged version exists to remove.
- **Decoder glitching.** Between two codes of $S$ the decoder can transiently assert no $d_k$ or two, so $R$ momentarily shows $0$ or the OR of two shifted words. Harmless in a synchronous datapath that samples after settling, a [[Static Hazards|static hazard]] anywhere it is not.
- **$S_{\max}+1$ not a power of two.** Harmless: codes above $S_{\max}$ simply have no column, matching the narrowed last stage of the staged architecture.
- **Where it survives.** $n\le4$; [[Sporadic Shifter|sporadic shift sets]] where only $|K|\ll S_{\max}$ distances are needed, so the array is $w_X|K|$ cells with a narrow OR; and any context where $D$ already exists — a decoded opcode, a one-hot FSM state — making the decoder free.

## RTL (Spade)

```spade
/// One-hot right shifter: R = OR over k of ( d_k AND (X >> k) ).
/// `x >> M` with M a compile-time constant is pure routing, not logic.
fn oh_terms<#uint N, #uint K, #uint M>(x: uint<N>, s: uint<K>) -> uint<N> {
    gen if M == N {
        0
    } else {
        let d: bool = s == M;                        // decoder minterm d_M
        let shifted: uint<N> = x >> M;               // hardwired shift by M
        (shifted & [d; N].as_uint()) | oh_terms::<N, K, {M + 1}>(x, s)
    }
}

fn onehot_shr<#uint N, #uint K>(x: uint<N>, s: uint<K>) -> uint<N> {
    oh_terms::<N, K, 0>(x, s)
}
```

`[d; N].as_uint()` replicates the decoder bit $d_k$ across $N$ bits — that is one *column* of the diagram, the AND cells sharing $d_k$. ANDing it with `x >> M` (the hardwired shift, drawn as the dashed diagonals) produces the whole column at once, and `|` accumulates the columns into the per-row OR boxes. All widths are $N$ throughout: `>>` and `&` and `|` are width-preserving, and the logical `>>` on `uint<N>` supplies the zero padding that makes the array triangular. Combinational; a `fn`, so it may contain no register. Two things synthesis does differently from the drawing: the source writes the OR reduction as a left-leaning chain, but it is an OR reduction and the tool balances it into the $\lceil\log_2 N\rceil$ tree shown; and it will very likely discard the flat array entirely and re-infer a staged mux tree. Spade has no `gen for`, so the loop over $k$ is `gen if` recursion, unrolled at monomorphisation — which also means the generic body is only type-checked once `onehot_shr::<8,3>` exists.

Simulated against `x >> s` in Icarus: 6 named vectors including the asymmetric `10000001 >> 1 = 01000000` and `10000000 >> 7 = 00000001`, plus 3000 random $(x,s)$ pairs — 3006 vectors, zero mismatches.

## Related Notes

- [[Barrel Shifters]] – compares: the staged architecture this flattens, and the one that wins at every width worth building.
- [[Choosing a Shifter]] – compares: where the flat array sits against every sibling in the cost table.
- [[Combinational Logic]] – depends-on: the decoder and the sum-of-products multiplexer identity the whole construction is assembled from.
- [[Lookup-Tables]] – counter-example: the 6-LUT merge of two mux rows that makes the barrel shifter cheap on FPGA has no analogue in a two-level AND-OR array.
- [[Shift by Multiplier]] – extends: same one-hot decode of $S$, but the AND-OR array is a DSP block's partial-product array instead of fabric.
- [[Sporadic Shifter]] – supports: the one regime where a flat array is competitive, because $|K|$ replaces $S_{\max}$.
- [[Shifter with Sticky Bit Computation]] – counter-example: the early-sticky optimisation needs stages, so it is forfeited here.
- [[Exact Full Shifter]] – compares: the triangular saving disappears when $w_R=w_X+S_{\max}$.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.1.4 Barrel shifter, p. 314 — the $w_R=w_X$ definition, equal stage sizes and equal $s_i$ fanout; Fig. 10.6, p. 315.
- FPGA-specific remark, p. 314 — two mux rows merged per 6-LUT.
- FPGA-specific remark, p. 315 — wide ORs on fast carry logic rather than gate trees.
- §10.2.1, p. 319, footnote 4 — the "a MUX is one gate delay" convention used in the depth comparison.
- §10.4 To read further, p. 325 — sporadic shifters, DSP-based shifts.

[[Shifters]] — the long-form note: derivation of the staged decomposition, and the *Trade-offs* table whose "naive mux-per-position" row is the cost summary of this architecture.
