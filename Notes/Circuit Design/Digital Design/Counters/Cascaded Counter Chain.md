---
title: Cascaded Counter Chain
description: "Wide counters from k-bit slices: ripple-carry enable (ENT chained, depth linear in slices) versus parallel enable (constant depth, wide AND and high state fan-in per slice)."
kind: circuit
status: seed
spade: simulated
tags: [digital, counters]
aliases:
  - Cascaded Counters
  - Counter Cascade
  - Enable Chaining
  - ENP/ENT
---

# Cascaded Counter Chain

An $n$-bit synchronous counter assembled from $m=n/k$ identical $k$-bit slices, distinguished by *how the carry between slices is delivered*: rippled through each slice's terminal count, or broadcast as a wide AND of the slice-full flags.

```tikz title="Ripple-carry enable versus parallel enable across three k-bit counter slices"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  %% ================= Panel A: ripple-carry enable =================
  \node[anchor=west] at (-1.6,8.4) {\textbf{Ripple-carry enable} \quad $\mathrm{TC}_j \to \mathrm{ENT}_{j+1}$: depth grows with the slice count $m$};

  \foreach \i/\x in {0/0.4, 1/3.9, 2/7.4} {
    \draw[thick] (\x,5.3) rectangle (\x+2.2,6.9);
    \node at (\x+1.1,6.45) {slice \i};
    \node at (\x+1.1,5.85) {$k$-bit counter};
  }

  % ENP rail across the top
  \draw (-1.6,7.6) -- (9.6,7.6);
  \node[anchor=south west] at (-1.55,7.65) {EN};
  \foreach \x in {1.0, 4.5, 8.0} {
    \draw[->] (\x,7.6) -- (\x,6.9);
    \node[anchor=west] at (\x+0.06,7.2) {ENP};
  }
  % EN also feeds ENT of slice 0
  \draw (-1.4,7.6) -- (-1.4,6.1) -- (0.2,6.1);
  \draw[->] (0.2,6.1) -- (0.4,6.1);
  \node[anchor=south] at (-0.7,6.15) {ENT$_0$};

  % TC chain
  \draw[->] (2.6,6.1) -- (3.9,6.1);
  \node[anchor=south] at (3.25,6.15) {$\mathrm{TC}_0$};
  \node[anchor=north] at (3.25,6.05) {ENT};
  \draw[->] (6.1,6.1) -- (7.4,6.1);
  \node[anchor=south] at (6.75,6.15) {$\mathrm{TC}_1$};
  \node[anchor=north] at (6.75,6.05) {ENT};
  \draw[->] (9.6,6.1) -- (10.4,6.1);
  \node[anchor=south] at (10.0,6.15) {$\mathrm{TC}_2$};

  % Q outputs
  \draw[->] (1.5,5.3) -- (1.5,4.6);
  \node[anchor=north] at (1.5,4.55) {$Q[k{-}1{:}0]$};
  \draw[->] (5.0,5.3) -- (5.0,4.6);
  \node[anchor=north] at (5.0,4.55) {$Q[2k{-}1{:}k]$};
  \draw[->] (8.5,5.3) -- (8.5,4.6);
  \node[anchor=north] at (8.5,4.55) {$Q[3k{-}1{:}2k]$};

  \node[anchor=west] at (-1.6,3.8) {setup path: $t_{cq} + m\,t_{\mathrm{TC}} + t_{su}$ \quad ($m$ slices, $n = mk$ bits total)};

  %% ================= Panel B: parallel enable =================
  \node[anchor=west] at (-1.6,3.0) {\textbf{Parallel (synchronous) enable} \quad one wide AND per slice: one gate level, fan-in and fan-out $O(m)$};

  \foreach \i/\x in {0/0.4, 1/3.9, 2/7.4} {
    \draw[thick] (\x,0.5) rectangle (\x+2.2,2.1);
    \node at (\x+1.1,1.65) {slice \i};
    \node at (\x+1.1,1.05) {$k$-bit counter};
  }

  % F0 skipping over slice 1 to slice 2
  \draw (3.0,1.3) -- (3.0,2.4) -- (8.4,2.4);
  \draw[->] (8.4,2.4) -- (8.4,2.1);
  \node[anchor=south] at (5.7,2.42) {$F_0$ again};

  % F0, F1 to the next slice
  \draw[->] (2.6,1.3) -- (3.9,1.3);
  \node[anchor=south] at (3.35,1.35) {$F_0$};
  \draw[->] (6.1,1.3) -- (7.4,1.3);
  \node[anchor=south] at (6.75,1.35) {$F_1$};

  % EN bus underneath
  \draw (-1.6,-0.3) -- (9.6,-0.3);
  \node[anchor=south west] at (-1.55,-0.25) {EN};
  \foreach \x in {0.9, 4.4, 7.9} \draw[->] (\x,-0.3) -- (\x,0.5);

  \node[anchor=west] at (-1.6,-1.0) {$F_j=\bigwedge_{i<k} Q_j[i]$ (slice $j$ all ones); slice $j$ counts on $\mathrm{EN}\wedge F_0\wedge\cdots\wedge F_{j-1}$};
  \node[anchor=west] at (-1.6,-1.7) {setup path: $t_{cq} + t_{\wedge}(m{+}1) + t_{su}$: one gate level, but $t_{\wedge}$ grows with its fan-in};
\end{circuitikz}
\end{document}
```

**Cut the carry recurrence at slice boundaries.** From [[Incrementer]] the unrolled carry into bit $i$ of an $n$-bit counter is $c_i=\mathrm{EN}\cdot\prod_{j<i}q_j$, a pure AND-prefix over the state bits. Partition the $n$ bits into $m$ contiguous slices of $k$, so bit $i$ of slice $j$ carries global index $jk+i$ and the state word is $Q=\{Q_{m-1},\dots,Q_0\}$ with each $Q_j$ of width $k$ ($n=mk$ bits). Associativity of AND lets the product be regrouped along those boundaries:

$$c_{jk+i}\;=\;\mathrm{EN}\cdot\underbrace{\Big(\prod_{l<j}\ \prod_{t<k} q_{lk+t}\Big)}_{\text{whole slices below }j}\cdot\prod_{t<i}q_{jk+t}$$

Name the inner product of a whole slice $F_l=\bigwedge_{t<k}Q_l[t]$ — one bit, asserted when slice $l$ reads all ones. The right-hand factor is *exactly* the carry a stand-alone $k$-bit slice computes internally from its own carry-in, so nothing inside a slice changes. The whole cascading problem collapses to one line: deliver $\mathrm{EN}\wedge F_0\wedge\cdots\wedge F_{j-1}$ to slice $j$ as its carry-in ($1$ bit).

**Ripple-carry enable evaluates that AND left-deep.** Give each slice a terminal-count output $\mathrm{TC}_j=\mathrm{ENT}_j\wedge F_j$ ($1$ bit) and wire $\mathrm{ENT}_{j+1}=\mathrm{TC}_j$, with $\mathrm{ENT}_0=\mathrm{EN}$. Induction on $j$ gives $\mathrm{TC}_j=\mathrm{EN}\wedge F_0\wedge\cdots\wedge F_j$: the base case is $\mathrm{TC}_0=\mathrm{EN}\wedge F_0$, and the step substitutes the hypothesis into the definition. The Boolean function is the one above, but the association is $((\mathrm{EN}\wedge F_0)\wedge F_1)\wedge\cdots$ — a chain of $m$ two-input gates, so $t_\text{logic}$ grows as $m\,t_{\mathrm{TC}}$ and the $F_l$ for large $l$ arrive with slack they cannot spend. This is the `ENT` input of the 74x161/163 and the reason a cascade of four of them does not run at the speed of one.

**Parallel enable evaluates the same AND flat.** Every slice sees the global `EN` directly and forms $\bigwedge_{l<j}F_l$ itself from the lower slices' state bits, which are register outputs and therefore available at $t_{cq}$. The critical path is now one wide AND instead of a chain — but "constant depth" is only true with unbounded fan-in. Decomposed into gates of fan-in $r$, an AND of $jk+1$ literals is $\lceil\log_r(jk+1)\rceil$ deep, so the honest statement is $O(\log n)$ versus $O(m)$. The costs it does pay are real: each state bit of slice $0$ drives $m-1$ downstream ANDs, and the total gate-input count over all slices is $\sum_{j<m} j = \Theta(m^2)$ against the ripple chain's $\Theta(m)$.

**Two enable pins exist to separate the broadcast from the chain.** With a single enable per slice the global `EN` would have to enter at slice $0$ and travel the whole $\mathrm{TC}$ chain, so a late-arriving `EN` would add $m\,t_{\mathrm{TC}}$ to *its* path as well as to the carry's. The `ENP`/`ENT` split fixes this: `ENP` gates counting only and is broadcast in parallel to every slice, `ENT` gates counting **and** $\mathrm{TC}$ and is what the chain occupies. `EN` therefore reaches the far slice in one net delay, and only the $F_l$ products ripple. A slice counts on $\mathrm{ENP}\wedge\mathrm{ENT}$; $\mathrm{TC}$ must be gated by `ENT` and not by `ENP`, otherwise a disabled lower slice sitting at all-ones would keep handing a carry upward and the high slices would run free.

**The two disciplines are the endpoints of a prefix problem, not a binary choice.** $\mathrm{EN}\wedge F_0\wedge\cdots\wedge F_{j-1}$ for all $j$ is a prefix-AND over the $m$-element sequence $(\mathrm{EN},F_0,\dots,F_{m-2})$ — the same degenerate prefix problem [[Prefix Incrementer]] solves inside a single word, one level up the hierarchy. Ripple enable is the serial prefix scan, parallel enable is the fully-fanned-out one, and a Brent–Kung or Kogge–Stone scan over the $F_l$ gives $\lceil\log_2 m\rceil$ depth with $O(m)$ gates and bounded fan-out. Groups of four slices chained internally and combined in a tree is the usual practical point, exactly as with block carry-lookahead.

**On FPGA, do not cascade at all.** The argument in [[Synchronous Counters]] carries: a hard carry chain (`CARRY4`/`CARRY8`, Intel ALM carry) propagates a bit far below one LUT delay, so a 64-bit counter as one chain beats any slicing of it into LUT-combined groups. Cascading returns only when the chain must break for placement — a long chain pins the counter to a single column of the fabric, and above roughly a few hundred bits that placement constraint costs more than it saves. Where FPGA does make the choice free is the enable: every slice flop has a dedicated `CE` port, so broadcasting `EN` to all $m$ slices costs zero logic and zero levels, and each $F_l$ is one 6-LUT per $6$ bits of slice ([[FPGAs]]). Parallel enable is therefore the default on fabric and ripple enable the ASIC/74-series artefact.

$$\boxed{\ \text{carry into slice } j \;=\; \mathrm{EN}\wedge F_0\wedge\cdots\wedge F_{j-1},\qquad F_l=\bigwedge_{t<k}Q_l[t]\ }$$

Both disciplines compute this identical function; they differ only in how it is associated, at $m\,t_{\mathrm{TC}}$ depth and $\Theta(m)$ gates for the chain against one wide-AND level and $\Theta(m^2)$ gate inputs for the broadcast.

**When it breaks.**

- **`TC` used as a downstream strobe.** With ripple enable $\mathrm{TC}_{m-1}$ is the *last* signal to settle. The counter itself can meet timing while a consumer of $\mathrm{TC}_{m-1}$ does not, because that consumer's setup path is the whole chain plus the consumer's own logic. Register the terminal count.
- **Unequal slice widths.** Nothing above requires $k$ to divide $n$; a short top slice works, but its $F$ is a narrower AND and its `TC` arrives earlier, so a synthesis tool balancing the chain will not find the imbalance for you.
- **$m$ small.** For $m\le 3$ the chain is at most three gates and the $\Theta(m^2)$ fan-out of the parallel form buys nothing measurable. The asymptotics only start mattering around $m\ge 8$, i.e. counters past $32$–$64$ bits at $k=4$–$8$.
- **Neither form fixes the low slice.** Both leave $f_\text{max}$ bounded by the $k$-bit slice's own internal increment. If that is the binding constraint, cascading is the wrong lever entirely and [[Two-Stage Prescaled Counter]] — which gives the high half $2^k$ clock periods to settle rather than one — is the structure that actually raises $f_\text{max}$.
- **Reset and load must be broadcast, never chained.** A cleared low slice asserts no `TC`, so a chained clear leaves higher slices holding stale state for one cycle. `CLR` and `LD` go to every slice in parallel.

**RTL (Spade).**

```spade
// One k-bit slice with the 74x163 ENP/ENT split.
entity ctr_slice<#uint K>(clk: clock, rst: bool, enp: bool, ent: bool) -> (uint<K>, bool) {
    reg(clk) q: uint<K> reset(rst: 0) = if enp && ent { trunc(q + 1) } else { q };
    (q, ent && q.as_bits().reduce_and())
}

// Ripple-carry enable: TC of slice j drives ENT of slice j+1.
entity ctr12_ripple(clk: clock, rst: bool, en: bool) -> uint<12> {
    let (q0, tc0) = inst ctr_slice::<4>(clk, rst, en, en);
    let (q1, tc1) = inst ctr_slice::<4>(clk, rst, en, tc0);
    let (q2, _)   = inst ctr_slice::<4>(clk, rst, en, tc1);
    q2.concat(q1).concat(q0)
}

// Parallel enable: each slice ANDs EN with the all-ones flags of the lower
// slices, taken straight off their state bits.
entity ctr12_parallel(clk: clock, rst: bool, en: bool) -> uint<12> {
    decl f0, f1;
    let (q0, _) = inst ctr_slice::<4>(clk, rst, en, true);
    let (q1, _) = inst ctr_slice::<4>(clk, rst, en && f0, true);
    let (q2, _) = inst ctr_slice::<4>(clk, rst, en && f0 && f1, true);
    let f0 = q0.as_bits().reduce_and();
    let f1 = q1.as_bits().reduce_and();
    q2.concat(q1).concat(q0)
}
```

`enp`/`ent` are the two enable pins of the diagram; the returned `bool` is $\mathrm{TC}_j$ and `q.as_bits().reduce_and()` is $F_j$, the $k$-input AND. In `ctr12_ripple` the `tc0`/`tc1` bindings are the combinational chain — each is a fresh gate driven by the previous one, which is precisely the depth being paid. In `ctr12_parallel` the `decl` forward-declares flags that are only defined after the instantiations; this is not feedback, since `f0` and `f1` come off register outputs, and it emits as one flat AND cone per slice. `q2.concat(q1).concat(q0)` is the $12$-bit word with slice $0$ in the low nibble (for integers `concat` puts the left operand high — the opposite of the array convention). Both entities are registered; everything else is combinational. Synthesis will not preserve the drawing's two shapes: with `keep` off, a tool given `ctr12_ripple` is free to re-associate the AND chain into whatever depth meets timing, so the distinction survives only in the fan-out and in what the placer can do with it.

**Related notes.**

- [[Synchronous Counters]] – depends-on: the single-clock discipline every slice in the chain obeys.
- [[Incrementer]] – depends-on: supplies the unrolled carry $c_i=\mathrm{EN}\cdot\prod_{j<i}q_j$ that gets regrouped at slice boundaries here.
- [[Prefix Incrementer]] – extends: the same AND-prefix problem solved with a tree, one level below; the tree applies to the $F_l$ sequence too.
- [[Two-Stage Prescaled Counter]] – compares: also splits a wide counter, but slows the high half by a factor of $2^k$ instead of feeding it every cycle.
- [[Asynchronous Counters]] – counter-example: the same "each stage waits for the one below" dependency, realised in the time domain, and losing the common clock in the process.
- [[Choosing a Counter]] – compares: where a cascade sits against the other wide-counter structures.
- [[Counters]] – depends-on: topic hub.

## References

No book source; written from established digital-design canon and from the long-form note `2.8) Counters.md`, §"Synchronous counters".

- Wakerly, *Digital Design: Principles and Practices* — counters; the 74x161/163 `ENP`/`ENT` enable structure and multi-chip cascading.
- Mano & Ciletti, *Digital Design* — registers and counters; counter cascading with the count-enable/terminal-count convention.
- Weste & Harris, *CMOS VLSI Design* — datapath subsystems; incrementers as degenerate adders and the prefix-tree reassociation of a carry chain.
