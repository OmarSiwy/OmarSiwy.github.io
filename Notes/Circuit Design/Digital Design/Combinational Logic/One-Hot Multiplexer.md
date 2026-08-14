---
title: "One-Hot Multiplexer"
description: "Decode the select and drive a flat AND-OR: two levels on paper, but a 2^n-wide OR and a branched select path make it slower than the deeper tree above 4:1."
kind: circuit
source: "Established digital-design canon — no assigned book source"
status: seed
spade: simulated
tags: [digital, combinational-logic, multiplexer, decoder, one-hot]
aliases:
  - "One-Hot Mux"
  - "One-Hot Multiplexers"
  - "AND-OR Multiplexer"
  - "Two-Level Multiplexer"
  - "Decoded Multiplexer"
  - "Sum-of-Products Multiplexer"
---

# One-Hot Multiplexer

A $2^n{:}1$ multiplexer built as a [[Binary Decoder]] followed by a flat AND-OR plane, which is the only mux form whose depth is constant in $n$ and the only one whose *gate fan-in* is not.

```tikz title="One-hot 4:1 multiplexer: decoder, AND plane, and one 2^n-wide OR"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \ctikzset{logic ports=ieee, logic ports origin=center}

  % ---------------- decoder ----------------
  \draw (-4.4,1.8) rectangle (-1.2,3.4);
  \node[align=center] at (-2.8,2.6) {$2\!\to\!4$ decoder\\ {\footnotesize $h_i=\prod_j s_j^{(i_j)}$}};
  \draw[->] (-6.2,2.6) -- (-4.4,2.6);
  \draw (-5.4,2.45) -- (-5.2,2.75);
  \node[anchor=south] at (-5.3,2.75) {2};
  \node[anchor=south] at (-6.2,2.65) {$S[1{:}0]$};

  % ---------------- AND plane ----------------
  \node[and port] (g0) at (1.6,0) {};
  \node[and port] (g1) at (4.4,0) {};
  \node[and port] (g2) at (7.2,0) {};
  \node[and port] (g3) at (10.0,0) {};

  % one-hot rails: the innermost drop takes the lowest rail, so nothing crosses
  \draw (-1.2,2.0) -- (0.75,2.0) |- (g0.in 1);
  \draw (-1.2,2.4) -- (3.55,2.4) |- (g1.in 1);
  \draw (-1.2,2.8) -- (6.35,2.8) |- (g2.in 1);
  \draw (-1.2,3.2) -- (9.15,3.2) |- (g3.in 1);
  \node[anchor=south, font=\footnotesize] at (-0.3,2.02) {$h_0$, 1};
  \node[anchor=south, font=\footnotesize] at (2.4,2.42) {$h_1$, 1};
  \node[anchor=south, font=\footnotesize] at (5.2,2.82) {$h_2$, 1};
  \node[anchor=south, font=\footnotesize] at (8.0,3.22) {$h_3$, 1};

  % data enters each AND from below, clear of the one-hot rails
  \foreach \i/\g in {0/g0, 1/g1, 2/g2, 3/g3} {
    \draw (\g.in 2) -- ++(-0.55,0) -- ++(0,-1.0)
      node[anchor=north west, xshift=-3pt, font=\footnotesize] {$D_\i$, $w$};
  }

  % ---------------- OR collapse ----------------
  \node[or port, number inputs=4] (orz) at (13.4,-3.0) {};
  \draw (g0.out) -- (2.35,0) |- (orz.in 4);
  \draw (g1.out) -- (5.15,0) |- (orz.in 3);
  \draw (g2.out) -- (7.95,0) |- (orz.in 2);
  \draw (g3.out) -- (10.75,0) |- (orz.in 1);
  \draw (orz.out) -- (15.2,-3.0);
  \draw (14.5,-3.15) -- (14.7,-2.85);
  \node[anchor=south] at (14.6,-2.85) {$w$};
  \node[anchor=west] at (15.25,-3.0) {$Y$};

  % ---------------- annotations ----------------
  \node[anchor=north west, align=left, text=black!60] at (-6.2,-4.4)
    {Two gate levels after the decoder --- but the OR has fan-in $2^n$, and the select
     reaches $Y$\\ only through decode $\to$ AND $\to$ OR, so it is the select, not the
     data, that is critical.\\[2pt]
     Every AND and OR symbol is $w$ gates in parallel, one per data bit, so each $h_i$
     drives $w$ AND inputs.\\
     At $n=2$, $w=1$, NAND-NAND: 4 NAND3 $+$ 1 NAND4 $+$ 2 INV, critical path $13.6\,\tau$.};
\end{circuitikz}
\end{document}
```

*Widths: $S$ is $n=2$ bits, each $h_i$ is 1 bit, each $D_i$ and $Y$ are $w$ bits. My own construction, drawn from the flat SOP below.*

**Flatten the Shannon recursion instead of nesting it.** A $2^n{:}1$ mux is the full [[Combinational Logic|Shannon expansion]] on all $n$ select variables, $Y=\bar s_{n-1}Y|_{s_{n-1}=0}+s_{n-1}Y|_{s_{n-1}=1}$ applied $n$ times. Nesting the recursion literally gives the [[Multiplexer Tree]]. Expanding it instead — repeatedly applying **distributivity of AND over OR** until no parenthesis survives — multiplies the $n$ select literals of each path into a single product, and the tree collapses into one sum of $2^n$ disjoint products:

$$Y=\bigvee_{i=0}^{2^n-1} h_i\,D_i,\qquad h_i=\prod_{j=0}^{n-1}s_j^{(i_j)},\qquad s_j^{(1)}=s_j,\;\;s_j^{(0)}=\bar s_j$$

$h_i$ is exactly minterm $i$ of the select word, so the $h$ vector is a $n\to2^n$ decoder output: $2^n$ bits of which exactly one is high, by the **complement law** $s_j\bar s_j=0$ making any two products disjoint and $\sum_i h_i = 1$ covering every select value. Widths: $S$ is $n$ bits, $h$ is $2^n$ bits, each $D_i$ is $w$ bits, $Y$ is $w$ bits, and the data plane carries $2^n w$ bits in total. The AND and OR symbols in the diagram are each $w$ gates deep into the page — one per data bit — so a single $h_i$ fans out to $w$ AND inputs.

**One-hotness is what licenses the OR.** Because at most one product is ever nonzero, $\vee$ can be replaced by $\oplus$, by unsigned $+$, or by a wired junction with no gate at all, and the function is unchanged. This is the same precondition the plain [[Binary Encoder]] runs on, and it is a *precondition*, not a property of the OR: feed the plane two hot lines and it emits $D_i \vee D_j$, a bitwise OR of two words that is a legal answer for neither. Everything the one-hot form buys — and every way it fails — traces back to that single invariant.

**Two levels is a fiction the moment you count fan-in.** Merging the decoder's minterm AND with the data AND (they are adjacent AND gates, so **associativity of AND** fuses them) gives $2^n$ gates of $n+1$ inputs feeding one gate of $2^n$ inputs: genuinely two levels, against the tree's $n$. In NAND-NAND form at $n=2,w=1$ that is 7 gates and 18 gate inputs — *fewer* than the tree's 11 gates and 20 inputs. The unit-gate model therefore says the flat form wins on both depth and area, and the unit-gate model is wrong here in a way that is not a rounding error.

**Price the wide gates with [[Logical Effort]] and the ordering inverts.** For a NAND of fan-in $k$, $g=\frac{k+2}{3}$ and $p=k$: both grow *linearly in fan-in*, so the final NAND$(2^n)$ costs $g=\frac{2^n+2}{3}$ and $p=2^n$ — exponential in $n$. The select path is the critical one, because a select literal must traverse its inverter, then the AND plane, then the OR, while branching to half the products ($b=2^{n-1}$):

$$F=\underbrace{1}_{\text{INV}}\cdot\underbrace{\tfrac{n+3}{3}}_{\text{NAND}(n{+}1)}\cdot\underbrace{\tfrac{2^n+2}{3}}_{\text{NAND}(2^n)}\cdot\underbrace{2^{\,n-1}}_{B},\qquad P=1+(n+1)+2^n$$

$$D_{\text{flat}}(n)=3F^{1/3}+P,\qquad D_{\text{tree}}(n)=n\hat f+P_{\text{tree}}=6n$$

with the tree figure from $G=2^n$, $B=H=1$, $\hat f=(2^n)^{1/n}=2$ and $p=4$ per MUX2. Evaluated at $H=1$:

| $2^n{:}1$ | $D_{\text{flat}}$ | $D_{\text{tree}}$ | widest gate (flat) |
| --- | --- | --- | --- |
| $4{:}1$ | $13.6\,\tau$ | $12\,\tau$ | 4 |
| $8{:}1$ | $22\,\tau$ | $18\,\tau$ | 8 |
| $16{:}1$ | $36.5\,\tau$ | $24\,\tau$ | 16 |

At $n=1$ there is nothing to compare — the flat form *is* a 2:1 mux, with no gate wider than two inputs — so the table starts where the two circuits diverge. From $4{:}1$ upward the flat form loses at every width, by a margin that widens because $P$ alone contributes $2^n$ while the tree's whole delay is $6n$. **Depth is not delay**: the flat mux is $2n-2$ gate levels shallower and still slower, and this is the cleanest counterexample to level-counting in the whole of combinational design.

**What actually survives is the version with no OR gate.** The exponential term is entirely the OR's, so the flat form is worth building only where the OR is free. Two cases: a tri-state or wired-OR bus, where the $2^n$ drivers merge on a metal node and the "gate" is a wire; and a [[Transmission-Gate Multiplexer]] driven one-hot, where each branch is two transistors and the merge is again a wired junction. In both, depth really is $O(1)$ in $n$ and the cost moves into the $2^n$-way loading of the shared node, which is capacitive and therefore linear rather than a fan-in penalty. Crossbars, register-file read ports and SRAM column muxes are all this circuit, not the tree.

> [!important] The decoder is not free and it is not one-hot in transit
> Between the moment $S$ changes and the moment the decoder settles, the $h$ vector passes through states with **two** hot lines or **none**. On an AND-OR plane that means a transient wrong word or a transient zero — ugly but harmless behind a register. On a wired-OR or tri-state bus it means **driver contention**, which is a short circuit, not a glitch. That is why every real one-hot bus gates the enables with a break-before-make discipline instead of trusting the decoder's one-hot invariant during the transition.

**On an FPGA the whole comparison disappears below six inputs.** A $4{:}1$ mux is $4+2=6$ inputs and fits one LUT6 exactly: the flat and tree netlists are the same circuit after technology mapping, and arguing about a NAND4 is arguing about a netlist the mapper deleted. Above the LUT boundary the flat form is strictly worse, because a $2^n$-wide OR maps to a $\lceil\log_6 2^n\rceil$-deep tree of [[Lookup-Tables]] plus general routing, whereas the tree's next Shannon step is a hardened `MUXF7`/`MUXF8` with no routing hop at all. The one FPGA case that favours one-hot is when the hot vector *already exists* — a one-hot-encoded state register, or a decoded ready vector — so the decode costs nothing and each product is a 2-input function.

$$\boxed{\;Y=\bigvee_{i=0}^{2^n-1}h_iD_i,\quad h_i=\prod_j s_j^{(i_j)},\qquad D_{\text{flat}}=3F^{1/3}+2^n+n+2\;\;\text{vs}\;\;D_{\text{tree}}=6n\;}$$

**When it breaks.**

- **Any $n>1$ with static CMOS gates.** The $2^n$ fan-in is unbuildable past $k\approx4$; synthesis trees the OR, at which point you have a [[Multiplexer Tree]] with a redundant decoder bolted to the front. The "two-level" claim survives only on paper or on a wired-OR node.
- **A select that is not guaranteed one-hot.** Two hot lines silently produce $D_i\vee D_j$; zero hot lines produce $0$, which is indistinguishable from a legitimate all-zero datum. Neither is an error the circuit can report — add a validity OR if the caller needs one.
- **Multi-bit select transitions.** Going from $S=01$ to $S=10$ changes two bits, so the circuit traverses $S=00$ or $S=11$ and emits $D_0$ or $D_3$ on the way. This is a **function hazard**: a property of the mux's truth table, not of the netlist, and no consensus term, no [[Hazard-Free Two-Level Cover]] and no delay balancing removes it. Only a Gray-coded or genuinely glitch-free one-hot select avoids it.
- **Single-bit select transitions still glitch, but removably.** With $D_i=D_j=1$ across an adjacent select change the two covering products hand off through a gap — the classic static-1 [[Logic Hazards|logic hazard]]. Here the flat form is at its best: two-level SOP is the only shape with a clean K-map criterion for hazard-freedom, so the repair is $2^n$ consensus products $D_iD_j$, one per adjacent pair, and it is provably complete.
- **Wide $w$.** Each $h_i$ drives $w$ AND inputs, so the decoder needs buffering proportional to $w$ and the branching effort $B$ in the model above is understated by a factor of $w$. At $w=64$ the select path is a fanout problem, not a fan-in problem.

**RTL (Spade).**

```spade
/// 2-bit binary decoder: the four minterms of the select word, exactly one high.
fn dec2(s: uint<2>) -> [bool; 4] {
    let b = s.as_bits();
    [!b[1] && !b[0], !b[1] && b[0], b[1] && !b[0], b[1] && b[0]]
}

/// Flat AND-OR collapse: OR of every data word masked by its one-hot bit.
fn andor<#uint W, #uint K>(hot: [bool; K], d: [uint<W>; K]) -> uint<W> {
    gen if K == 0 {
        0
    } else {
        let head: uint<W> = if hot[0] { d[0] } else { 0 };
        head | andor(hot[1..K], d[1..K])
    }
}

fn mux4<#uint W>(d: [uint<W>; 4], s: uint<2>) -> uint<W> {
    andor(dec2(s), d)
}
```

`dec2` is the decoder box and its four outputs are the $h$ rails; `andor` is the AND plane and the OR together, one recursion step per rail. `b = s.as_bits()` indexes LSB-first, so `b[0]` is $s_0$ and the array literal lists $h_0\ldots h_3$ in that order — reverse either and the circuit still compiles and still type-checks, which is the entire reason this block is simulated rather than merely verified. Widths are flat throughout: `|` on two `uint<W>` stays $W$ bits, no growth, no `trunc`; only `K` shrinks, at compile time. Everything is `fn`, so it is purely combinational — no clock, no state. `andor` is generic in the port count `K` but `dec2` is not, because Spade has no `gen for` and $K=2^n$ cannot be expressed as a width relation on $n$; a wider one-hot mux instantiates `andor` against a wider decoder. Synthesis will not honour the shape: the `if hot[0]` masks become AND gates but the right-nested `|` chain is re-balanced into an OR tree by any tool, so the drawing's single wide OR exists in the source and nowhere in the netlist.

**Related Notes (with context).**

- [[Multiplexer Tree]] – compares: the same Shannon expansion left nested instead of flattened; wins above $2{:}1$ on delay and is the only form that scales.
- [[Binary Decoder]] – depends-on: generates the $h$ vector, and its own fan-in problem is the first half of this circuit's cost.
- [[Predecoder]] – extends: splits the $n$-input minterm ANDs into two halves of AND2s, which is the only way the decoder half of this circuit survives large $n$.
- [[Logical Effort]] – supports: supplies $g=\frac{k+2}{3}$, $p=k$, and $\hat f=F^{1/N}$, without which the flat form looks faster than the tree.
- [[Hazard-Free Two-Level Cover]] – extends: the consensus repair that makes this exact SOP glitch-free under single-bit select changes.
- [[Logic Hazards]] – depends-on: the static-1 mechanism, and the function-hazard boundary that limits what any repair can do.
- [[Transmission-Gate Multiplexer]] – extends: the same one-hot control with the OR replaced by a wired junction, which is where the flat form is actually the right answer.
- [[Demultiplexer]] – counter-example: the dual circuit, one input steered to $2^n$ outputs by the same decoder.
- [[Choosing a Combinational Block]] – compares: where this sits against every sibling by $n$, $w$ and target.
- [[Lookup-Tables]] – counter-example: on an FPGA a $4{:}1$ mux is one LUT6 and the flat-versus-tree distinction is erased by technology mapping.

## References

Established digital-design canon; no page numbers, since this note has no assigned book source.

- Sum-of-minterms multiplexers, decoders as minterm generators, the one-hot precondition on encoders — Mano & Ciletti, *Digital Design*, ch. 4; Wakerly, *Digital Design: Principles and Practices*, ch. 6.
- Static-1 hazards in two-level SOP, consensus terms, function versus logic hazards — Wakerly, ch. 4.
- Logical effort, the linear fan-in penalty in both $g$ and $p$, $\hat f=F^{1/N}$ and FO4 — Weste & Harris, *CMOS VLSI Design*, ch. 4; Sutherland, Sproull & Harris, *Logical Effort*, chs. 1–3.
- The $4{:}1$ worked comparison ($12\,\tau$ tree against $13.6\,\tau$ flat, gate and gate-input counts, LUT6 mapping) is re-cut from [[Combinational Logic]], §"Worked example: a 4:1 multiplexer, two ways" and §"Trade-offs"; the $8{:}1$ and $16{:}1$ rows are the same model evaluated at $n=3,4$.
