---
title: Synchronous Counters
description: "One clock for the whole word: state valid after t_cq regardless of width, at the cost of putting the increment chain inside the clock period."
kind: circuit
source: "2.8) Counters §Synchronous counters, §4-bit synchronous up-counter, §FPGA mapping, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, sequential, timing, fpga]
aliases:
  - Synchronous Counter
  - Synchronous Binary Counter
  - Synchronous Up-Counter
---

# Synchronous Counters

A counter whose flops all share one clock, so the entire state word changes on one edge and is valid a fixed $t_{cq}$ later no matter how wide it is — the width instead shows up inside the clock period, as combinational depth.

```tikz title="4-bit synchronous up-counter: one clock net, the toggle chain is the carry chain, TC is its carry-out"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- common clock, one net for the whole word ---
  \draw (-2.6,3.9) -- (10.4,3.9);
  \node[left] at (-2.65,3.9) {clk};

  \foreach \i in {0,1,2,3} {
    \pgfmathsetmacro\c{3.2*\i}

    % state flip-flop
    \draw (\c-0.6,2.0) rectangle (\c+0.6,3.0);
    \node at (\c,2.5) {$q_{\i}$};
    \fill (\c,3.9) circle (1.6pt);
    \draw[->] (\c,3.9) -- (\c,3.0);

    % XOR under the flop
    \draw (\c-0.6,0.9) rectangle (\c+0.6,1.7);
    \node at (\c,1.3) {$\oplus$};

    % XOR output -> flop D input
    \draw[->] (\c-0.6,1.3) -- (\c-1.15,1.3) -- (\c-1.15,2.5) -- (\c-0.6,2.5);

    % flop output -> right, down; feeds its own XOR and the AND of the next stage
    \draw (\c+0.6,2.5) -- (\c+1.35,2.5) -- (\c+1.35,0.7);
    \fill (\c+1.35,1.3) circle (1.6pt);
    \draw[->] (\c+1.35,1.3) -- (\c+0.6,1.3);

    % toggle term t_i branches up into the XOR
    \fill (\c,0.35) circle (1.6pt);
    \draw[->] (\c,0.35) -- (\c,0.9);
    \node[anchor=south west] at (\c+0.02,0.42) {$t_{\i}$};

    % AND cell of the toggle chain: t_{i+1} = t_i AND q_i
    \draw (\c+1.0,0.0) rectangle (\c+1.7,0.7);
    \node at (\c+1.35,0.35) {$\wedge$};
    \draw[->] (\c+1.7,0.35) -- (\c+2.6,0.35);
  }

  % enable enters as the carry-in of the increment
  \draw[->] (-2.6,0.35) -- (-0.6,0.35);
  \node[anchor=south] at (-1.6,0.42) {EN $=c_0$ \, / \, $1$};

  % terminal count leaves as the carry-out; state word leaves the top row
  \node[anchor=west] at (12.3,0.35) {TC $=c_4$ \, / \, $1$};
  \fill (10.95,2.5) circle (1.6pt);
  \draw[->] (10.95,2.5) -- (11.6,2.5);
  \node[anchor=west] at (11.65,2.5) {$Q=q_3q_2q_1q_0$ \, / \, $n=4$};

  \node[anchor=north] at (4.8,-0.35) {every wire drawn is $1$ bit};

\end{circuitikz}
\end{document}
```

**Fix what "synchronous" buys, because it is a timing property and nothing else.** The state is $Q\in\{0,1\}^n$, the enable EN and the terminal count TC are $1$ bit each, and the next-state function is $Q^{+}=Q+1 \bmod 2^n$ — an autonomous Moore machine in the sense of [[Synchronous Sequential Logic]], with no input to decode. Every flop takes the same clock net, so every $q_i$ launches on the same edge and the whole word is valid $t_{cq}+t_{\text{skew}}$ after it, *independently of $n$*. That is the entire distinction from [[Asynchronous Counters]], where stage $i$ is clocked by stage $i-1$ and the word is garbage for $n\,t_{cq}$ after every edge. The arithmetic is identical; only the causality of the toggles differs.

**Take the recurrence from the incrementer rather than rebuilding it.** [[Incrementer]] shows that $A+1$ is a chain of half adders once the constant is absorbed into the carry-in — with every $b_i=0$, the identities $x\oplus0=x$ and $x\cdot0=0$ collapse the full adder to $s_i=a_i\oplus c_i$, $c_{i+1}=a_ic_i$. Feeding that chain from the state itself, $a_i=q_i$ and $c_0=\text{EN}$, and unrolling the recurrence by induction gives the closed form

$$q_i^{+}=q_i\oplus\Big(\text{EN}\cdot\!\!\prod_{j<i}q_j\Big),\qquad \text{TC}=c_n=\text{EN}\cdot\!\!\prod_{j<n}q_j$$

**Bit $i$ toggles when the enable is high and every lower bit is 1.** Two consequences pay for the whole structure. First, the enable enters as $c_0$, not as a mux select on the flop inputs: with $\text{EN}=0$ every $c_i=0$ by $0\cdot x=0$, so every $q_i^{+}=q_i\oplus 0=q_i$ and the state holds for free — $n$ 2:1 muxes deleted. Second, TC is the chain's own carry-out, already computed at the top of the chain; a separate all-ones comparator would be redundant logic.

**Pay for it in the clock period.** From [[Introduction to Flip-Flops & Latches]] the closing constraint on a same-edge loop is

$$T_{\text{clk}}\;\ge\;t_{cq}+t_{\text{logic}}+t_{su}+t_{\text{skew}}$$

and here $t_{\text{logic}}$ is the increment. Realising $\prod_{j<i}q_j$ as the linear chain $t_{i+1}=t_i\wedge q_i$ of the drawing costs $(n-1)\,t_{\text{AND}}+t_{\text{XOR}}$; reassociating the same product into a tree — legal because AND is associative, and the construction is a [[Prefix Incrementer]] — costs $\lceil\log_2 n\rceil\,t_{\text{AND}}+t_{\text{XOR}}$. Note where that delay lands: it is inside the flop-to-flop loop, so it is subtracted from $f_{\max}$ every cycle, whereas a ripple counter's delay is spent *after* the edge and only limits when the word may be sampled. Same nanoseconds, different budget.

**Trace four bits and the chain becomes visibly the carry chain.** Substituting $n=4$ and writing $t_i$ for the toggle term:

$$
\begin{aligned}
q_0^{+}&=q_0\oplus\text{EN} & t_0&=\text{EN}\\
q_1^{+}&=q_1\oplus(\text{EN}\,q_0) & t_1&=t_0\,q_0\\
q_2^{+}&=q_2\oplus(\text{EN}\,q_0q_1) & t_2&=t_1\,q_1\\
q_3^{+}&=q_3\oplus(\text{EN}\,q_0q_1q_2) & t_3&=t_2\,q_2\\
\text{TC}&=\text{EN}\,q_0q_1q_2q_3 & &=t_3\,q_3
\end{aligned}
$$

The right column is the point: each toggle term is the previous one ANDed with one state bit, four AND2 and four XOR2 in total. With $\text{EN}=1$, $Q=q_3q_2q_1q_0$ and $T=t_3t_2t_1t_0$:

| $Q$ | $q_0$ | $q_1$ | $q_2$ | $T$ | $Q^{+}$ | TC |
| --- | --- | --- | --- | --- | --- | --- |
| $0110$ | 0 | 1 | 1 | $0001$ | $0111$ | 0 |
| $0111$ | 1 | 1 | 1 | $1111$ | $1000$ | 0 |
| $1000$ | 0 | 0 | 0 | $0001$ | $1001$ | 0 |
| $1111$ | 1 | 1 | 1 | $1111$ | $0000$ | **1** |

$0111\to1000$ flips all four bits on one edge — the transition that makes a binary count unsafe to sample from another clock domain, and the reason [[Gray Counter]] exists. The last row is the wrap: $Q^{+}=Q+1 \bmod 2^4$, exact integer arithmetic, $0$ ulp, so none of the rounding machinery of [[Error Accuracy]] applies; the carry-out is not lost, it *is* TC.

**Chain the enable across slices two ways, and know that they are not equivalent.** Building a wide counter from $k$-bit slices, the classic 74x161/163 split is worth copying:

- *Ripple-carry enable* — TC of slice $j$ drives EN of slice $j+1$. The enable is combinational through every slice, so $t_{\text{logic}}$ grows linearly in the slice count and the whole point of going synchronous erodes. This is the `ENT` port; see [[Cascaded Counter Chain]].
- *Parallel enable* — every slice sees the same EN and ANDs its own all-ones condition locally. Constant depth, at the price of a wide AND per slice and higher fan-out on the state bits. This is the `ENP`/`ENT` split: `ENP` gates counting only, `ENT` additionally gates TC so a chain can still ripple through it.

**Escape the depth entirely by decoupling the halves.** When $n$ is large and $f$ is high, split into a fast low half of $k$ bits and a slow high half of $n-k$; the high half increments only on the low half's TC, so its long chain has $2^{k}$ clock periods to settle rather than one, and $f_{\max}$ is set by the $k$-bit slice alone. The concatenation $\{Q_{\text{hi}},Q_{\text{lo}}\}$ is still an exact binary count — see [[Two-Stage Prescaled Counter]]. Pick $k$ so the low slice just meets timing and no smaller.

> [!note] Synchronous does not mean glitch-free
> All flops switch on the same edge, but not at the *same instant*: intra-register clock skew and per-flop $t_{cq}$ spread mean a decoder watching $Q$ still sees transient codes, for a window of $t_{\text{skew}}+\Delta t_{cq}$ rather than the ripple counter's $n\,t_{cq}$. Short is not zero. If the decoded output is a strobe, an enable, or anything a downstream flop's asynchronous port sees, **register the decode**: compute "will equal $N$ next cycle" from $Q^{+}$ and clock it, so the strobe leaves a flop rather than a cone of logic.

**On FPGA, do not build the tree.** Every modern fabric has a dedicated carry chain (Xilinx `CARRY4`/`CARRY8`, Intel ALM carry) whose per-bit propagation delay is far below one LUT delay and whose routing is hardwired, so the linear chain above maps one bit per carry stage: the LUT computes the toggle condition, the carry cell does the AND, and the flop is the one already sitting unused in the slice. A prefix tree trades that hard logic for general LUTs and general routing and loses at any width you would plausibly build — the same conclusion as [[Adders]], transferred wholesale. Three further wins ([[FPGAs]], [[Lookup-Tables]]): the flop's `CE` port makes EN literally free rather than merely mux-free, its `SR` port makes a *synchronous* clear free (which is why compare-and-clear [[Modulo-N Counter|modulo-$N$]] is cheaper on FPGA than the gate count suggests), and a 6-LUT computing $t_i$ has inputs to spare, so the load mux and an up/down XOR ([[Up-Down Counter]]) usually fold into the same lookup at zero extra levels. Above ~48 bits, or when the increment is a constant other than 1, the hard accumulator in a DSP block beats fabric logic on both counts.

$$\boxed{\ q_i^{+}=q_i\oplus t_i,\quad t_0=\text{EN},\quad t_{i+1}=t_i\wedge q_i,\quad \text{TC}=t_n\ }$$

**When it breaks**

- **The chain becomes the critical path.** $O(n)$ AND delay is invisible at $n=8$ and fatal at $n=64$ on a fast ASIC clock. The order of escape is: [[Prefix Incrementer]] if the count must stay monotone and wide, [[Two-Stage Prescaled Counter]] if only the low bits are timing-critical, [[Fibonacci LFSR]] or [[Galois LFSR]] if the count is a deadline rather than a quantity — one XOR of depth, independent of $n$.
- **Anything that decodes $Q$ combinationally sees glitches** for $t_{\text{skew}}+\Delta t_{cq}$ at every edge, as above. Register the decode or use an encoding whose decode is structurally clean ([[Ring Counter]], [[Johnson Counter]]).
- **A binary count must not cross a clock domain.** All-bits-change transitions like $0111\to1000$ let the receiver latch a word that was never a count; that is a correctness failure, not a timing margin, and [[Gray Counter]] is the fix.
- **Clock power scales with $n$.** All $n$ flops toggle their clock pin at $f$ whether or not they change state, so the clock tree, not the logic, dominates power in a wide fast counter. A pure $\div 2^m$ prescaler in front of the counted bits ([[Asynchronous Counters]]) removes that cost for the stages nobody reads.
- **Non-power-of-two moduli leave unreachable states.** With $N<2^n$ the $2^n-N$ unused codes are not guaranteed to walk back into the legal cycle after an upset — see the state-graph argument in [[Modulo-N Counter]] — so either prove self-starting behaviour or spend the reset.

**RTL (Spade)**

```spade
entity sync_counter<#uint N>(
    clk: clock, rst: bool, en: bool, ld: bool, d: uint<N>
) -> (uint<N>, bool) {
    decl q_next;
    reg(clk) q: uint<N> reset(rst: 0) = q_next;

    let inc = q + 1;                                  // uint<{N+1}>: sum bits + carry-out
    let q_next: uint<N> = if ld { d }
                          else if en { trunc(inc) }
                          else { q };
    (q, en && inc.msb())
}
```

`q` is the flop row of the diagram and `q_next` the XOR outputs feeding their D inputs; `decl` is needed only because the register is written before the logic that drives it. `q + 1` widens to `uint<{N+1}>` by the usual growth rule, and that extra bit *is* $c_n$ — so `inc.msb()` is TC read straight off the carry chain, exactly as the drawing shows, while `trunc` discards it into the $\bmod\,2^n$ wrap that the counter is specified to do. The whole body is one combinational cone between two edges of a single `reg(clk)`: no second clock, no gated clock. Synthesis will not emit the $n$ discrete AND2 gates of the diagram — on FPGA it maps `q + 1` onto the hard carry chain and `en`/`ld` onto the slice flop's `CE` port, which is why the drawing is a derivation aid and not a netlist.

**Related Notes**

- [[Incrementer]] – depends-on: the half-adder collapse and the carry recurrence this counter closes a register around.
- [[Introduction to Flip-Flops & Latches]] – depends-on: the setup/hold constraint that turns the chain's depth into an $f_{\max}$ number.
- [[Synchronous Sequential Logic]] – supports: the Moore-machine framing, and the unused-state analysis a non-power-of-two modulus needs.
- [[Asynchronous Counters]] – counter-example: drop the shared clock and the delay moves out of the period and into the validity window.
- [[Prefix Incrementer]] – extends: reassociates the AND chain into a tree, $O(n)\to O(\log n)$ depth.
- [[Two-Stage Prescaled Counter]] – extends: gives the wide half $2^k$ periods to settle instead of one.
- [[Cascaded Counter Chain]] – extends: the `ENP`/`ENT` slice composition, and how the enable path decides whether it stays constant-depth.
- [[Gray Counter]] – compares: the same core plus a registered conversion, for counts that leave the clock domain.
- [[Lookup-Tables]] – supports: why the linear chain wins on fabric and the control bits cost nothing.
- [[Choosing a Counter]] – compares: where this sits against every sibling structure.

## References

- [[2.8) Counters]] — §Synchronous counters (timing constraint, enable chaining, two-stage decomposition, the glitch note), §4-bit synchronous up-counter (equations and trace table), §FPGA mapping, §Trade-offs (the two synchronous rows).
- No textbook source for this topic. Standard treatments: Mano & Ciletti, *Digital Design* — registers and counters, synchronous vs. ripple, unused-state analysis; Wakerly, *Digital Design: Principles and Practices* — the 74x161/163 `ENP`/`ENT` structure; Weste & Harris, *CMOS VLSI Design* — incrementers as degenerate adders and the clock-power argument. Page numbers are deliberately omitted; no copy was consulted while writing.
