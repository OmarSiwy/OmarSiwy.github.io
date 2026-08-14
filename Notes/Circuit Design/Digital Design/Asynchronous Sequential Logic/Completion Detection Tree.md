---
title: Completion Detection Tree
description: "ORs each dual-rail pair and trees the results, so the datapath tells you when it is finished instead of a clock guessing — and puts that tree on the critical path."
kind: circuit
status: seed
spade: simulated
tags: [digital, asynchronous-sequential-logic]
aliases:
  - Completion Detection
  - Completion Detector
  - Completion Tree
  - Done Tree
---

# Completion Detection Tree

A reduction network that turns a dual-rail word into a single `done` bit by ORing each bit's two rails and ANDing the $k$ results — the only validity signal in asynchronous design that is a function of the *data* rather than of an assumed delay.

```tikz title="Completion detection for a 4-bit dual-rail word: OR per bit, AND tree over the bits"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- per-bit validity: OR of the two rails ---
  \foreach \i/\y in {0/0, 1/-1.7, 2/-3.4, 3/-5.1} {
    \node[or port] (v\i) at (0,\y) {};
    \draw (v\i.in 1) -- ++(-1.1,0) node[anchor=east] {$b_{\i}.0$};
    \draw (v\i.in 2) -- ++(-1.1,0) node[anchor=east] {$b_{\i}.1$};
  }

  % --- level 1 of the AND tree ---
  \node[and port] (a0) at (3.4,-0.85) {};
  \node[and port] (a1) at (3.4,-4.25) {};
  \draw (v0.out) -| ($(a0.in 1)+(-0.7,0)$) -- (a0.in 1);
  \draw (v1.out) -| ($(a0.in 2)+(-0.7,0)$) -- (a0.in 2);
  \draw (v2.out) -| ($(a1.in 1)+(-0.7,0)$) -- (a1.in 1);
  \draw (v3.out) -| ($(a1.in 2)+(-0.7,0)$) -- (a1.in 2);

  % --- level 2: root ---
  \node[and port] (a2) at (6.8,-2.55) {};
  \draw (a0.out) -| ($(a2.in 1)+(-0.7,0)$) -- (a2.in 1);
  \draw (a1.out) -| ($(a2.in 2)+(-0.7,0)$) -- (a2.in 2);
  \draw[->] (a2.out) -- ++(1.6,0) node[anchor=west] {\texttt{done} [1]};

  % --- annotations ---
  \node[anchor=south] at (-2.0,0.9) {$2k$ rails};
  \node[anchor=south] at (0.9,0.9) {$v_i$ [$k$]};
  \node[anchor=south] at (5.1,0.9) {AND tree, depth $\lceil\log_2 k\rceil$};
  \draw[dashed] (-1.3,0.75) -- (-1.3,-6.0);
  \draw[dashed] (1.9,0.75) -- (1.9,-6.0);
  \node[anchor=north] at (0.3,-6.0) {bit layer};
  \node[anchor=north] at (5.2,-6.0) {reduction layer};
\end{circuitikz}
\end{document}
```

*The bit layer is fixed at one OR per bit; only the reduction layer has a shape to choose.*

**Turn "is the datum here?" into a Boolean function of the datum.** Under [[Dual-Rail Encoding]] each bit $b_i$ occupies two 1-bit wires $b_i.0$ and $b_i.1$, with $00$ the spacer, $10$ logic 0, $01$ logic 1, and $11$ illegal. The spacer is the only legal code with both rails low, so the predicate "bit $i$ has arrived" is exactly

$$v_i \;=\; b_i.0 \vee b_i.1 \qquad [1\text{ bit}]$$

and a $k$-bit word is complete when every $v_i$ holds. This is what a [[Bundled-Data Interface]] cannot do: there, validity lives on a separate `req` wire whose timing is an *assumption* about the datapath, discharged by a [[Matched Delay Line]] sized to $t_{pd,\max}$. Here validity is derived, so no delay is assumed and no margin is spent.

**Reassociate the conjunction into a tree.** The word-level predicate is a $k$-input AND, and a linear chain of two-input ANDs would cost $k-1$ gate delays. Associativity of AND lets the product be bracketed arbitrarily, so a balanced binary bracketing gives depth $\lceil\log_2 k\rceil$ at the same $k-1$ gate count. With gates of fan-in $r$ the same argument gives $\lceil\log_r k\rceil$ levels and $\lceil (k-1)/(r-1)\rceil$ gates. Total latency of the detector is one OR level plus the tree:

$$T_{\text{det}} \;=\; t_{\vee} \;+\; \lceil\log_r k\rceil\, t_{\wedge}$$

**Detect emptiness too, and notice it is not the complement of the tree.** The return-to-spacer half of a [[Four-Phase Handshake]] needs the dual predicate "every bit is back to $00$", which by De Morgan is $\bigwedge_i \overline{v_i} = \overline{\bigvee_i v_i}$ — a NOR over the same $v_i$, a second tree. The AND tree alone does not give it: `done` falls as soon as the *first* bit returns to spacer, which is many gate delays before the last one does.

> [!note] The C-element tree exists because AND has the wrong falling edge
> Replacing every AND in the reduction layer with a [[Muller C-Element]] gives one tree that does both jobs. $Y = \mathrm{maj}(a,b,y)$ drives high only when both subtrees are valid, drives low only when both are spacer, and **holds** in between — so the output rises on the last arriving bit and falls on the last departing bit, symmetrically. An AND tree is correct on the rising edge and premature on the falling one, and a sender that treats the falling edge as "the receiver is empty" will drive the next datum onto rails that still hold the previous one. That asymmetry, not gate count, is the whole reason four-phase dual-rail is drawn with C-elements.

**You may not prune the tree.** Martin's acknowledgement condition for QDI says every transition on every wire must be acknowledged by some subsequent transition, and in a dual-rail stage the completion tree *is* that acknowledgement. Detecting on a subset of bits — the high half, say, on the argument that the low half always arrives first — reintroduces a delay assumption and with it everything the encoding was bought to avoid. The tree's fan-in is $2k$ and that is not negotiable; only its shape is.

**The tree is in series with the function, twice per datum.** A four-phase dual-rail stage pays $t_f + T_{\text{det}}$ on the data phase and again on the return-to-spacer phase, against $\max(t_f,\,t_{\text{matched}})$ for bundled data. That is the single line item behind the "worst-case latency: worst" cell in [[Choosing an Asynchronous Style]] — QDI recovers average-case delay inside $t_f$ and then hands a $\log k$ term back at every stage boundary. [[1-of-4 Encoding]] attacks the constant: four wires carry 2 bits, so $v$ is a 4-input OR covering two bits and the reduction layer has $k/2$ leaves instead of $k$, one level shallower at the same wire count.

**FPGA mapping folds the OR layer into the tree for free; ASIC does not.** A 6-LUT computes any function of six inputs in one level, so the natural radix is $r=6$ and the first level absorbs three whole rail pairs — $(b_0.0 \vee b_0.1) \wedge (b_1.0 \vee b_1.1) \wedge (b_2.0 \vee b_2.1)$ is six inputs, one LUT. A 32-bit word therefore needs $\lceil 32/3\rceil = 11$ LUTs at level 1, then $\lceil 11/6\rceil = 2$, then 1: **14 LUTs, 3 logic levels.** On ASIC the standard form is instead a wide pseudo-nMOS or dynamic NOR — one pull-down transistor per rail, so a 32-input stage is one gate rather than a tree, at the cost of static current or a precharge phase. Both are, per [[FPGAs]], only half the story: the tree's *output* forks to the whole stage's latch control, and that fork is precisely where the isochronic assumption has to hold, which FPGA routing will not honour.

$$\boxed{\ \texttt{done} \;=\; \bigwedge_{i=0}^{k-1}\big(b_i.0 \vee b_i.1\big), \qquad T_{\text{det}} = t_{\vee} + \lceil\log_r k\rceil\,t_{\wedge}\ }$$

**When it breaks.**

- **It is not an error detector.** The illegal code $11$ satisfies $v_i = 1$, so a stuck-at-1 fault on a rail makes the word look complete forever. Detecting $11$ costs a second AND per bit and a second tree, and is normally skipped because a correct QDI producer cannot generate it.
- **Cheap functions.** For a bitwise operation the function block is one gate deep while the detector is $1 + \lceil\log_r k\rceil$ — the completion tree *is* the stage delay. Bundled data with a short matched delay wins outright here; QDI only pays off when $t_f$ itself is large and data-dependent.
- **Mixed encodings.** A datapath that keeps some bits single-rail has no $v_i$ for them; they are invisible to the tree and revert to the matched-delay contract, so the stage is only as delay-insensitive as its worst bit.
- **Registering the tree.** Pipelining the reduction to shorten its critical path inserts a clocked element into the one path whose correctness rests on being purely combinational, and destroys the acknowledgement.
- **Wide parallel joins.** Completion of $N$ parallel units is $\mathbb{E}[\max_i t_i] \to t_{\max}$, so a completion tree spanning a wide join measures the worst case it was built to avoid.

**RTL (Spade).**

```spade
/// Dual-rail completion: OR each rail pair, then reduce.
/// rail0/rail1 are the k .0 and .1 wires packed as words, bit i = pair i.
fn detect<#uint K>(rail0: uint<K>, rail1: uint<K>) -> (bool, bool) {
    let valid = (rail0 | rail1).as_bits();   // v_i, K bits
    (valid.reduce_and(), !valid.reduce_or()) // (done, empty)
}
```

`rail0 | rail1` is the bit layer — $K$ two-input ORs in one expression, one per pair in the diagram. `reduce_and` is the AND tree and `!reduce_or` the NOR tree; neither fixes a shape, because associativity means the netlist bracketing is the synthesiser's choice and only affects depth, not value. Everything here is combinational, as it must be: a registered `done` would be a clock. What synthesis will do differently from the drawing is exactly the callout above — it emits a balanced AND tree, never a C-element tree, since the held state of a C-element is combinational feedback that Spade cannot express (see [[Muller C-Element]]); the entity below is therefore the two-phase / bundled-data-with-completion form, not the four-phase QDI one.

Compiled and simulated through a width-8 wrapper `detect8(rail0: uint<8>, rail1: uint<8>) -> uint<2>` packing `{done, empty}`: 3008 vectors, 8 named plus a 3000-case random sweep against `&(a|b)` / `~|(a|b)`, zero failures. The named set includes the asymmetric partial arrival $\texttt{rail0}=\texttt{0x01},\ \texttt{rail1}=\texttt{0x00}$ — exactly one bit valid, so neither `done` nor `empty` — which is the vector that fails if the two reductions are swapped.

**Related Notes.**

- [[Dual-Rail Encoding]] – depends-on: supplies the spacer code that makes $v_i$ meaningful; without it there is nothing to detect.
- [[Muller C-Element]] – extends: replaces each AND to give the tree a symmetric falling edge, at the price of combinational feedback.
- [[Four-Phase Handshake]] – supports: the protocol whose return-to-spacer phase demands the emptiness tree as well as the completion tree.
- [[Matched Delay Line]] – counter-example: buys the same `req` signal with an assumption instead of a computation, one gate delay instead of $\log k$.
- [[1-of-4 Encoding]] – compares: halves the leaf count of the reduction layer at identical wire count.
- [[Choosing an Asynchronous Style]] – compares: where this tree's $\log k$ term lands in the style-selection trade-off.

> [!warning] No measured timing figures
> This note has no assigned book source. The LUT counts above are derived arithmetically from 6-LUT fan-in; every $t_\vee$, $t_\wedge$ and energy figure is left symbolic, because no measurement is available and inventing one would be worse than omitting it.

## References

No assigned book source; written from standard digital-design canon and from `0.5) Asynchronous Sequential Logic` §§ *Handshaking protocols*, *Trade-offs*.

- J. Sparsø & S. Furber, *Principles of Asynchronous Circuit Design* — dual-rail completion detection, four-phase vs. two-phase, C-element trees.
- A. J. Martin, on the limitations of delay-insensitive circuits — the acknowledgement condition and the isochronic fork.
- N. Weste & D. Harris, *CMOS VLSI Design* — C-element circuit forms, wide dynamic NOR completion detectors.
- M. M. Mano & M. D. Ciletti, *Digital Design* — gate fan-in and tree-depth accounting.
