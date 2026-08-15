---
title: Monotonic String Leading Zero Counter
description: "Prefix-OR the input into a thermometer code, AND it with its own negated one-bit shift to get a one-hot marker, then read each count bit off a w_X/2-wide OR; log depth with fanout limited to 2, and the form that generalises to LOC, LBC and anticipation."
kind: circuit
source: "ASA §10.2.2.2, pp. 321-322"
status: seed
spade: simulated
tags: [digital, shifters, lzc, prefix, normalizer]
aliases:
  - LZC by Monotonic String Conversion
  - Monotonic String Conversion
  - Monotonic String LZC
  - Thermometer Code LZC
---

# Monotonic String Leading Zero Counter

The logarithmic LZC that never builds a wide multiplexer: it converts $X$ into a thermometer code by prefix-OR, differentiates that code into a one-hot marker, and reads the count out of $w_C$ plain OR gates, so no signal in the whole circuit drives more than two inputs.

```tikz title="LZC by monotonic string conversion, w_X = 16, worked on X = 0000010011011001"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex,
  str/.style={font=\small\ttfamily,inner sep=0.5pt},
  blk/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=32mm,minimum height=6mm,inner sep=2pt},
  orb/.style={draw,fill=black!5,rounded corners=1.5pt,minimum width=11mm,minimum height=5.5mm,inner sep=1pt},
  w/.style={font=\scriptsize,inner sep=1.2pt}
]
\node[w,anchor=east] at (-3.55,5.00) {$X=$};
\node[str,] at (-3.15,5.0) {0};  \node[str,] at (-2.73,5.0) {0};  \node[str,] at (-2.31,5.0) {0};  \node[str,] at (-1.89,5.0) {0};  \node[str,] at (-1.47,5.0) {0};  \node[str,] at (-1.05,5.0) {1};  \node[str,] at (-0.63,5.0) {0};  \node[str,] at (-0.21,5.0) {0};  \node[str,] at (0.21,5.0) {1};  \node[str,] at (0.63,5.0) {1};  \node[str,] at (1.05,5.0) {0};  \node[str,] at (1.47,5.0) {1};  \node[str,] at (1.89,5.0) {1};  \node[str,] at (2.31,5.0) {0};  \node[str,] at (2.73,5.0) {0};  \node[str,] at (3.15,5.0) {1};
\draw[->] (0,4.78) -- node[w,right]{$16$} (0,4.40);
\node[blk] at (0,4.10) {parallel prefix OR};
\draw[->] (0,3.80) -- node[w,right]{$16$} (0,3.46);
\node[w,anchor=east] at (-3.55,3.26) {$Y=$};
\node[str,] at (-3.15,3.26) {0};  \node[str,] at (-2.73,3.26) {0};  \node[str,] at (-2.31,3.26) {0};  \node[str,] at (-1.89,3.26) {0};  \node[str,] at (-1.47,3.26) {0};  \node[str,] at (-1.05,3.26) {1};  \node[str,] at (-0.63,3.26) {1};  \node[str,] at (-0.21,3.26) {1};  \node[str,] at (0.21,3.26) {1};  \node[str,] at (0.63,3.26) {1};  \node[str,] at (1.05,3.26) {1};  \node[str,] at (1.47,3.26) {1};  \node[str,] at (1.89,3.26) {1};  \node[str,] at (2.31,3.26) {1};  \node[str,] at (2.73,3.26) {1};  \node[str,] at (3.15,3.26) {1};
\node[w,anchor=east] at (-3.55,2.80) {$\overline{Y\gg1}=$};
\node[str,] at (-3.15,2.8) {1};  \node[str,] at (-2.73,2.8) {1};  \node[str,] at (-2.31,2.8) {1};  \node[str,] at (-1.89,2.8) {1};  \node[str,] at (-1.47,2.8) {1};  \node[str,] at (-1.05,2.8) {0};  \node[str,] at (-0.63,2.8) {0};  \node[str,] at (-0.21,2.8) {0};  \node[str,] at (0.21,2.8) {0};  \node[str,] at (0.63,2.8) {0};  \node[str,] at (1.05,2.8) {0};  \node[str,] at (1.47,2.8) {0};  \node[str,] at (1.89,2.8) {0};  \node[str,] at (2.31,2.8) {0};  \node[str,] at (2.73,2.8) {0};  \node[str,] at (3.15,2.8) {0};
\draw[->] (0,2.56) -- (0,2.26);
\node[blk] at (0,1.96) {bitwise AND};
\draw[->] (0,1.66) -- node[w,right]{$16$} (0,1.36);
\node[w,anchor=east] at (-3.55,1.16) {$Z=$};
\node[str,] at (-3.15,1.16) {0};  \node[str,] at (-2.73,1.16) {0};  \node[str,] at (-2.31,1.16) {0};  \node[str,] at (-1.89,1.16) {0};  \node[str,] at (-1.47,1.16) {0};  \node[str,red,] at (-1.05,1.16) {1};  \node[str,] at (-0.63,1.16) {0};  \node[str,] at (-0.21,1.16) {0};  \node[str,] at (0.21,1.16) {0};  \node[str,] at (0.63,1.16) {0};  \node[str,] at (1.05,1.16) {0};  \node[str,] at (1.47,1.16) {0};  \node[str,] at (1.89,1.16) {0};  \node[str,] at (2.31,1.16) {0};  \node[str,] at (2.73,1.16) {0};  \node[str,] at (3.15,1.16) {0};

% index ruler: p is counted from the MSB, so p IS the count
\node[w,gray] at (-3.15,0.78) {0};  \node[w,gray] at (-2.31,0.78) {2};  \node[w,gray] at (-1.47,0.78) {4};  \node[w,gray] at (-0.63,0.78) {6};  \node[w,gray] at (0.21,0.78) {8};  \node[w,gray] at (1.05,0.78) {10};  \node[w,gray] at (1.89,0.78) {12};  \node[w,gray] at (2.73,0.78) {14};
\node[w,anchor=west,gray] at (3.35,0.78) {$p$};

% vertical taps, each running down only to its deepest OR row
\foreach \x/\d in {-2.73/0.3, -2.31/-0.5, -1.89/-0.5, -1.47/-1.3, -1.05/-1.3, -0.63/-1.3, -0.21/-1.3, 0.21/-2.1, 0.63/-2.1, 1.05/-2.1, 1.47/-2.1, 1.89/-2.1, 2.31/-2.1, 2.73/-2.1, 3.15/-2.1}{\draw[gray] (\x,0.58) -- (\x,\d);}

\draw (-2.73,0.3) -- (3.90,0.3);
\fill (-2.73,0.3) circle (1.1pt); \fill (-1.89,0.3) circle (1.1pt); \fill (-1.05,0.3) circle (1.1pt); \fill (-0.21,0.3) circle (1.1pt); \fill (0.63,0.3) circle (1.1pt); \fill (1.47,0.3) circle (1.1pt); \fill (2.31,0.3) circle (1.1pt); \fill (3.15,0.3) circle (1.1pt); 
\node[orb] (o0) at (4.55,0.3) {OR};
\draw[->] (o0.east) -- (5.55,0.3); \node[w,anchor=west] at (5.60,0.3) {$c_0=1$};
\draw (-2.31,-0.5) -- (3.90,-0.5);
\fill (-2.31,-0.5) circle (1.1pt); \fill (-1.89,-0.5) circle (1.1pt); \fill (-0.63,-0.5) circle (1.1pt); \fill (-0.21,-0.5) circle (1.1pt); \fill (1.05,-0.5) circle (1.1pt); \fill (1.47,-0.5) circle (1.1pt); \fill (2.73,-0.5) circle (1.1pt); \fill (3.15,-0.5) circle (1.1pt); 
\node[orb] (o1) at (4.55,-0.5) {OR};
\draw[->] (o1.east) -- (5.55,-0.5); \node[w,anchor=west] at (5.60,-0.5) {$c_1=0$};
\draw (-1.47,-1.3) -- (3.90,-1.3);
\fill (-1.47,-1.3) circle (1.1pt); \fill (-1.05,-1.3) circle (1.1pt); \fill (-0.63,-1.3) circle (1.1pt); \fill (-0.21,-1.3) circle (1.1pt); \fill (1.89,-1.3) circle (1.1pt); \fill (2.31,-1.3) circle (1.1pt); \fill (2.73,-1.3) circle (1.1pt); \fill (3.15,-1.3) circle (1.1pt); 
\node[orb] (o2) at (4.55,-1.3) {OR};
\draw[->] (o2.east) -- (5.55,-1.3); \node[w,anchor=west] at (5.60,-1.3) {$c_2=1$};
\draw (0.21,-2.1) -- (3.90,-2.1);
\fill (0.21,-2.1) circle (1.1pt); \fill (0.63,-2.1) circle (1.1pt); \fill (1.05,-2.1) circle (1.1pt); \fill (1.47,-2.1) circle (1.1pt); \fill (1.89,-2.1) circle (1.1pt); \fill (2.31,-2.1) circle (1.1pt); \fill (2.73,-2.1) circle (1.1pt); \fill (3.15,-2.1) circle (1.1pt); 
\node[orb] (o3) at (4.55,-2.1) {OR};
\draw[->] (o3.east) -- (5.55,-2.1); \node[w,anchor=west] at (5.60,-2.1) {$c_3=0$};

\node[w,anchor=west,align=left] at (-3.55,-2.90)
  {each OR is $w_X/2=8$ inputs wide; tap $p$ feeds OR$_j$ iff bit $j$ of $p$ is 1};
\node[w,anchor=west,align=left] at (5.60,-2.90) {$C=0101_2=5$};
\end{circuitikz}
\end{document}
```

*After Fig. 10.12, p. 322.*

**Replace the search for a leading one by a prefix computation, and the depth is settled before any hardware is chosen.** Take $X$ on $w_X=2^{w_C}$ bits, indexed $x_{w_X-1}\ldots x_0$ with $x_{w_X-1}$ the MSB, and define the *monotonic string* $Y$ on the same $w_X$ bits by

$$y_i=\bigvee_{j\ge i}x_j$$

$Y$ has the same leading one as $X$ and nothing but ones to its left. Written this way it is an OR-scan, and $\vee$ is associative and idempotent, so $Y$ is a **prefix problem** in the exact sense of [[Parallel Prefix Adders]]: any bracketing of the reduction gives the same answer, therefore a balanced tree computes all $w_X$ outputs in $\log_2 w_X$ levels rather than $w_X$. Instantiating that tree as a [[Kogge-Stone Tree]] is the whole point of choosing this construction — Kogge–Stone holds **fanout at 2** on every node, which is precisely the property the [[Oklobdzija LZC Tree]] gives up. In vector form each of its $\log_2 w_X$ levels is one line, $Y\leftarrow Y\vee(Y\gg 2^t)$ for $t=0,\ldots,\log_2 w_X-1$, where $\gg$ shifts higher-index bits down into lower positions.

**Differentiate the thermometer code and the transition falls out as a one-hot vector.** $Y$ is a thermometer (unary) code: $n$ ones in a row encode the number $n$. Because it is monotone — $y_i\ge y_{i+1}$ for every $i$ — the discrete difference $y_i-y_{i+1}$ is never negative and never exceeds 1, so over $\mathbb{B}$ it is just $y_i\wedge\overline{y_{i+1}}$, i.e. the whole vector at once,

$$Z=Y\wedge\overline{Y\gg1}$$

with $y_{w_X}$ taken as $0$ so the MSB position is handled by the same formula. A monotone step function differenced once is an impulse: $Z$ is **one-hot** at the leading one of $X$, and identically zero when $X=0$. That is $w_X-1$ two-input ANDs (the top bit passes through) at one gate delay, and it is the only place in the circuit where $X$'s structure is consumed.

**A one-hot vector makes the encoder an OR, not an adder.** Let $p$ index positions from the MSB, $p=w_X-1-i$, so that $p$ *is* the leading-zero count at the position where $Z$ is set. The encoder we want is $C=\sum_p p\,z_p$ on $w_C=\log_2 w_X$ bits. Ordinarily that sum needs a [[Compressor Trees|compressor tree]] and a carry-propagate adder; here at most one $z_p$ is nonzero, so every addition has at most one nonzero addend and **addition degenerates to disjunction** bit by bit — no carries exist to propagate. Bit $j$ of $C$ is therefore the OR of the positions whose index has bit $j$ set:

$$c_j=\bigvee\{\,z_p\;:\;\lfloor p/2^{j}\rfloor\ \text{odd}\,\}$$

Exactly half of $[0,w_X)$ satisfies that predicate, so each $c_j$ is a **$w_X/2$-wide OR** and all $w_C$ of them run in parallel, one OR-tree delay of $\log_2(w_X/2)$. Concretely $c_0$ ORs every other bit of $Z$, $c_{w_C-1}$ ORs one contiguous half, and intermediate $c_j$ ORs alternating runs of $2^j$.

> [!important] The two indexings are complements, and the diagram is drawn in the one that reads as the answer
> The book writes $Z=s_{w_X-1}\ldots s_0$ in the usual LSB-first order, but the *count* runs the other way. Since $w_X-1$ is all ones for $w_X=2^{w_C}$, two's-complement bookkeeping is unnecessary: $p=(w_X-1)-i=\overline{i}$, a bitwise complement. So "OR the positions $p$ whose bit $j$ is **set**" and "OR the LSB-indices $i$ whose bit $j$ is **clear**" are the same wiring. Pick one and stay in it — swapping halves is a silent bug that no symmetric test vector catches, and the simulation below exists to catch exactly that.

**The all-zero case is already computed, for free.** $y_0=\bigvee_{j\ge0}x_j$ is the OR of every bit of $X$, so the zero flag is $z=\overline{y_0}$ — one inverter on a wire the prefix tree produces anyway. This matters because $Z=0$ when $X=0$ and the encoder then reports $C=0$, indistinguishable from a leading one at the MSB. The naive LZC dodges the collision differently, by taking $w_X=2^{w_C}-1$ and padding with ones so the count saturates at $w_X$ ([[Leading Zero Counters]]); the Oklobdzija tree carries an explicit $z$ bit up every level. Here the flag is a by-product, but it is **not optional** — worked example: $X=0$ and $X=\texttt{1000...0}$ both give $C=0$.

**What fanout 2 costs is a $\log$ factor of area and a factor of two in depth.** Delay is $\log_2 w_X$ (prefix) $+1$ (differentiate) $+\log_2(w_X/2)$ (readout) $\approx 2\log_2 w_X$ gate delays, against $\log_2 w_X$ mux delays for the Oklobdzija tree — but the Oklobdzija figure charges nothing for the select $z_L$ driving a whole $k$-bit-wide multiplexer, and the book is explicit that at large $w_X$ that fanout must be added back into the delay (p. 321). Area, counting two-input gates and *derived here rather than taken from the book*: a Kogge–Stone prefix has $w_X-2^t$ gates at level $t$, hence $w_X\log_2 w_X-w_X+1$ in total; plus $w_X-1$ ANDs; plus $w_C(w_X/2-1)$ for the readout ORs. At $w_X=16$ that is $49+15+28=92$ two-input gates, comparable to Oklobdzija's $2^{k+1}-k-2=26$ bit-level multiplexers plus $w_X$ ANDs — but the prefix term is $\Theta(w_X\log w_X)$ while Oklobdzija stays $\Theta(w_X)$, so the crossover runs the wrong way as $w_X$ grows.

**On FPGA the readout stops being the expensive half.** A wide OR does not synthesise as an OR tree on an FPGA — it maps onto the fast carry chain, whose delay is far below the $\log$ of its width ([[FPGAs]], [[Lookup-Tables]]). That collapses the second $\log_2 w_X$ of the delay and makes the $w_C$ wide ORs nearly free, leaving the Kogge–Stone prefix as the entire cost. It does not make this the right FPGA LZC — the naive recurrence is still preferred there because it is the only variant that fuses with a shifter into a [[Normalizers|normalizer]] — but it removes the readout from the argument.

**Genericity is the real reason to know this construction.** Nothing above used the fact that we were counting zeroes. Feeding $\overline{X}$ counts leading ones ([[Leading Bit Counter]]); feeding $X\oplus b$ for an input bit $b$ counts leading $b$s, at the cost of $b$'s fanout. More importantly, $Y$ is an *approximable* object: a string with the same leading one as the sum of two addends can be predicted from the addends directly, in parallel with the addition, which is [[Leading Zero Anticipation]] and is why a floating-point adder need not carry an LZC on its critical path at all. The book also notes an alternative to the OR readout — thermometer-to-binary conversion by [[Compressor Trees|compressor tree]] (p. 322).

$$\boxed{\ Y=\text{prefix-OR}(X),\quad Z=Y\wedge\overline{Y\gg1},\quad c_j=\bigvee_{\lfloor p/2^j\rfloor\ \text{odd}} z_p,\quad z_{\text{flag}}=\overline{y_0}\ }$$

**When it breaks.**

- **$X=0$** collapses $Z$ to zero and $C$ to $0$, which is a legal count. The zero flag $\overline{y_0}$ must be routed to the consumer, not dropped because the count "looks fine".
- **$w_X$ not a power of two.** The readout's half-and-half tap pattern is the binary expansion of $p$ over $[0,2^{w_C})$; a $w_X$ that is not $2^{w_C}$ leaves unused codes and the complement identity $p=\overline{i}$ fails. Zero-pad $X$ on the *right* to $2^{w_C}$ bits — padding on the left would shift the count.
- **Kogge–Stone's wiring, not its gates, is what bites.** Fanout 2 is bought with $\Theta(w_X\log w_X)$ long wires and heavy routing congestion; on ASIC above a few hundred bits a Brent–Kung or Ladner–Fischer prefix trades one or two levels of depth for far less wire, and the choice is the same one made for [[Adders|prefix adders]].
- **Small $w_X$.** Below $w_X\approx8$ the $2\log_2 w_X$ depth loses outright to the naive $k(k+1)/2$ chain, whose constant is smaller; the asymptotics only start paying around $w_X=16$–$32$.
- **It cannot be fused with a shifter.** Like every logarithmic LZC, all count bits appear simultaneously, so there is no MSB-first order for a left shifter to consume incrementally (p. 325). Choosing this circuit means paying LZC latency and shifter latency in series.

**RTL (Spade).**

```spade
/// Kogge-Stone prefix-OR: y_i = OR of x_j for all j >= i.
/// Index 0 is the LSB, so "j >= i" means "at or above bit i", and one
/// doubling step is `y | (y >> D)`.
fn prefix_or<#uint W, #uint D>(y: [bool; W]) -> [bool; W] {
    gen if D >= W {
        y
    } else {
        prefix_or::<W, {2 * D}>(y.bit_or(y[D..W].concat([false; D])))
    }
}

/// Read the count bits off the one-hot marker Z.
/// c_{K-1} is the OR of the low half of Z; the remaining bits depend only on
/// the position within a half, so OR the two halves together and recurse.
fn count_bits<#uint W, #uint H, #uint K>(z: uint<W>) -> uint<K> {
    gen if K == 0 {
        0
    } else {
        let b = z.as_bits();
        let lo: uint<H> = b[0..H].as_uint();
        let hi: uint<H> = b[H..W].as_uint();
        let top: bool = lo != 0;
        top.as_uint().concat(count_bits::<H, {H / 2}, {K - 1}>(hi | lo))
    }
}

/// LZC by monotonic string conversion. W = 2^K, H = W/2.
/// Returns (all-zero flag, leading-zero count on K bits).
fn lzc_mono<#uint W, #uint H, #uint K>(x: [bool; W]) -> (bool, uint<K>) {
    let y = prefix_or::<W, 1>(x);
    let z = y.bit_and(y[1..W].concat([false; 1]).bit_not());
    (!y[0], count_bits::<W, H, K>(z.as_uint()))
}
```

`prefix_or` is the parallel-prefix-OR block of the diagram, one `gen if` unrolling per level, so the emitted structure is literally $Y\vee(Y\gg1)$, then $\vee(Y\gg2)$, then $\vee(Y\gg4)$, then $\vee(Y\gg8)$ for $W=16$ — combinational throughout, no `reg`, no clock port, widths pinned at `[bool; W]` at every level because `(W-D)+D=W`. The one-hot line is `y.bit_and(...bit_not())`, the diagram's *bitwise AND* row. `count_bits` is the only place the RTL departs from the drawing: rather than $w_C$ independent $w_X/2$-wide ORs it takes `lo != 0` for the top count bit and then folds `hi | lo`, which is legal because $Z$ is one-hot and which shares the OR subtrees the four separate wide ORs would each rebuild — $\Theta(w_X)$ gates instead of $\Theta(w_X\log w_X)$, at the same depth. On FPGA that is the wrong trade, since the wide ORs the drawing shows are what the carry chain wants; the drawing is the mapping to prefer there.

> [!warning] Not covered in the source — needs outside research
> The book gives no LUT, delay or area figures for this architecture, and no comparison against Oklobdzija on real silicon. The gate counts above are derived from the structure, not measured, and the crossover width at which fanout makes the Oklobdzija tree lose is asserted qualitatively (p. 321) with no number attached.

Simulated against a behavioural leading-zero-count reference in Verilog: 11 named vectors — Fig. 10.12's own $X=\texttt{0000010011011001}\to C=5$, the all-zero case, `0x8000`$\to0$, `0x0001`$\to15$, and the asymmetric pairs `0x0002`/`0x4000` and `0x0100`/`0x0080` that a half-swap or a bit-reversal would break — plus 4000 random 16-bit words. 4011 vectors, all pass. Swapping `hi | lo` to `lo | hi` and the low-half test to the high half makes all 4011 fail, so the check is not vacuous.

**Related Notes.**

- [[Kogge-Stone Tree]] – depends-on: supplies the prefix stage, and its fanout-2 guarantee is the only reason to prefer this LZC.
- [[Parallel Prefix Adders]] – supports: the associativity argument that makes an OR-scan logarithmic is the same one that makes a carry chain a tree.
- [[Oklobdzija LZC Tree]] – compares: the other logarithmic LZC, half the depth and linear area, but a wide-multiplexer select whose fanout must be charged back.
- [[Leading Zero Counters]] – compares: the naive $O(\log^2 w_X)$ chain this one replaces, and still the FPGA choice.
- [[Leading Zero Anticipation]] – extends: approximate $Y$ from the addends instead of measuring it on the sum, and the LZC leaves the adder's critical path.
- [[Leading Bit Counter]] – extends: the same circuit fed $\overline{X}$ or $X\oplus b$, which is why this construction is called the general one.
- [[Compressor Trees]] – counter-example: the alternative thermometer-to-binary readout, where the encoder is an adder tree instead of a one-hot OR.
- [[Normalizers]] – counter-example: needs count bits MSB-first to fuse with a shifter, which every logarithmic LZC refuses to provide.
- [[Choosing a Shifter]] – compares: where this sits against every sibling in the topic.
- [[Lookup-Tables]] – supports: why the $w_C$ wide ORs cost far less than $\log$ of their width on an FPGA.
- [[Boolean Algebra]] – depends-on: associativity and idempotence of $\vee$, and the monotonicity that turns $y_i\wedge\overline{y_{i+1}}$ into a difference operator.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 10 "Shifters and Leading Bit Counters":

- §10.2.2.2 LZC by monotonic string conversion, pp. 321–322 — the definition $y_i=\bigvee_{j\ge i}x_j$, the Kogge–Stone reference [KS73], $Z=Y\wedge\overline{Y\gg1}$, the three bullets giving the $w_X/2$-wide OR readout, and the adaptation to LOC/LBC and leading-zero anticipation.
- Fig. 10.12, p. 322 — the architecture and its worked example $X=\texttt{0000010011011001}$; redrawn above with the position ruler added.
- §10.2.2.1 Oklobdzija's recursive construction, pp. 320–321 — the competing logarithmic LZC, its mux count $2^{k+1}-k-2$, and the fanout remark this note answers.
- §10.2.1, pp. 318–320 — the naive architecture and its $d_k=k(k+1)/2$ delay.
- §10.3, p. 325 — why logarithmic LZCs cannot be merged with a shifter.

> [!warning] PDF page offset is +19 in this chapter, not +22
> The brief states PDF page = printed page + 22 (verified at PDF 129 = printed 107). Chapter 10 does not follow it: PDF 341 renders printed 322 and PDF 342 renders printed 323. Every page cited above was read at +19 and its printed folio checked on the rendered page. The [[Barrel Shifters]] note records the same discrepancy.
