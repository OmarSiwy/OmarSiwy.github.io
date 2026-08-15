---
title: Ring Counter
description: "One-hot rotation: N flops for N states — hopeless density — but the decode of state k is the flop output itself, so zero decode logic, zero delay, structurally glitch-free; needs self-correcting feedback or a reset."
kind: circuit
source: "2.8) Counters §Ring and Johnson counters, §FPGA mapping, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, one-hot, shift-register, fsm]
aliases:
  - Ring Counters
  - One-Hot Counter
  - One-Hot Ring Counter
  - Ring (one-hot) counter
---

# Ring Counter

A shift register closed into a cycle and seeded with a single 1, so that the state is always one-hot and the decoded output for state $k$ is the flop output $q_k$ with no logic in between.

```tikz title="Four-state ring counter: shift chain, free one-hot decode, and the NOR that replaces the wrap wire to make it self-correcting"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- four D flip-flops in a row ----
  \foreach \i/\x in {0/1.5, 1/4.0, 2/6.5, 3/9.0} {
    \draw (\x,-0.7) rectangle (\x+1.2,0.7);
    \node at (\x+0.6,0.12) {$q_{\i}$};
    \node[anchor=west] at (\x+0.03,0.48) {\tiny D};
    \node[anchor=east] at (\x+1.17,0.48) {\tiny Q};
    \draw (\x,-0.55) -- (\x+0.22,-0.4) -- (\x,-0.25);
  }

  % ---- shift chain, 1 bit per hop ----
  \foreach \a/\b in {2.7/4.0, 5.2/6.5, 7.7/9.0} {
    \draw[->] (\a,0.48) -- (\b,0.48);
  }
  \node[above] at (3.35,0.5) {\tiny 1};
  \node[above] at (5.85,0.5) {\tiny 1};
  \node[above] at (8.35,0.5) {\tiny 1};

  % ---- tap points on each Q ----
  \foreach \x in {3.0, 5.5, 8.0} { \fill (\x,0.48) circle (1.5pt); }
  \draw (10.2,0.48) -- (10.9,0.48);
  \fill (10.5,0.48) circle (1.5pt);

  % ---- free decode: the flop output IS the phase ----
  \foreach \i/\x in {0/3.0, 1/5.5, 2/8.0, 3/10.5} {
    \draw[->] (\x,0.48) -- (\x,1.55);
    \node[above] at (\x,1.5) {$\phi_{\i}$};
  }
  \node[anchor=west] at (11.7,1.5) {\tiny decode of state $k$ \emph{is} $q_k$:};
  \node[anchor=west] at (11.7,1.1) {\tiny no logic, no delay, no glitch};

  % ---- plain ring closure (dashed): not self-starting ----
  \draw[dashed,->] (10.9,0.48) -- (10.9,2.55) -- (0.6,2.55) -- (0.6,0.48) -- (1.5,0.48);
  \node[above] at (5.6,2.55) {\tiny plain ring: $q_0^{+}=q_{3}$ \; --- weight is conserved, so it never self-starts};

  % ---- clock spine ----
  \draw (1.5,-1.2) -- (9.0,-1.2);
  \node[left] at (1.45,-1.2) {clk};
  \foreach \x in {1.5, 4.0, 6.5, 9.0} {
    \draw (\x,-1.2) -- (\x,-0.4);
    \fill (\x,-1.2) circle (1.5pt);
  }

  % ---- self-correcting feedback: NOR of the other N-1 bits ----
  \draw (3.0,0.48) -- (3.0,-2.0);
  \draw (5.5,0.48) -- (5.5,-2.6);
  \draw (8.0,0.48) -- (8.0,-3.2);
  \draw (3.0,-2.0) -- (10.35,-2.0);
  \draw (5.5,-2.6) -- (10.35,-2.6);
  \draw (8.0,-3.2) -- (10.35,-3.2);

  \node[nor port, number inputs=3] (NR) at (11.2,-2.6) {};
  \draw (10.35,-2.0) -- (NR.in 1);
  \draw (10.35,-2.6) -- (NR.in 2);
  \draw (10.35,-3.2) -- (NR.in 3);
  \node[anchor=west] at (11.7,-3.55) {\tiny NOR of the $N{-}1$ bits};
  \node[anchor=west] at (11.7,-3.95) {\tiny other than $q_{3}$};

  \draw (NR.out) -- (12.6,-2.6) -- (12.6,-4.4) -- (0.6,-4.4) -- (0.6,0.2);
  \draw[->] (0.6,0.2) -- (0.6,0.48) -- (1.5,0.48);
  \node[above] at (5.6,-4.4) {\tiny self-correcting: $q_0^{+}=\overline{q_0\vee q_1\vee q_2}$ --- one gate, and every state falls into the one-hot cycle};

\end{circuitikz}
\end{document}
```

*Own construction; the source note gives the recurrence in prose and has no figure.*

**Close the shift register and the state becomes a rotation.** Take $N$ D flip-flops holding the $N$-bit word $q=(q_{N-1},\dots,q_0)$, wire $q_i^{+}=q_{i-1}$ for $1\le i\le N-1$, and close the loop with $q_0^{+}=q_{N-1}$. That is the cyclic left rotation $q^{+}=\mathrm{rot}(q)$, a permutation of bit *positions* and therefore a bijection on $\{0,1\}^N$ with no arithmetic in it at all — no carry, no XOR, not even an inverter. Seed it with $q=1$ (one-hot at position 0) and the orbit is $1,2,4,\dots,2^{N-1},1$: exactly $N$ states from $N$ flops, against the $\lceil\log_2 N\rceil$ flops a binary [[Synchronous Counters|synchronous counter]] would need for the same modulus. Signals: $q$ is $N$ bits, `en` and `rst` are 1 bit each, and each decoded phase $\phi_k$ is 1 bit.

**The reason to pay that price is that the decoder disappears.** A binary counter that must drive $N$ distinct phases needs an $N$-output decoder: one AND per state over $\lceil\log_2 N\rceil$ literals of the count. Those literals are flop outputs that do *not* arrive together — clock skew $t_{\text{skew}}$ plus the clock-to-Q spread $\Delta t_{cq}$ across the register means that for a window of $t_{\text{skew}}+\Delta t_{cq}$ after every edge the decoder is evaluating a mixture of the old and new count words, and since the decode of a mixture is not the mixture of the decodes, it can momentarily assert a phase belonging to *neither* the old nor the new state. Any consumer that is level-sensitive — a precharge line, a non-overlapping clock phase, a write strobe — sees a real pulse. In a ring counter $\phi_k$ *is* $q_k$: the decode function is the identity, its combinational depth is $0$, and a single flop output has no hazard because there is nothing to race against itself. That structural glitch-freedom, not the flop count, is what buys multi-phase clock generators, round-robin arbiters, and one-hot [[Moore]] state encodings, where the next-state logic for a state is a plain OR of the transitions into it and its depth does not grow with the number of states ([[Synchronous Sequential Logic]]).

**Rotation conserves Hamming weight, and that single fact is why the plain ring is broken.** Let $w(q)=\sum_i q_i$. A permutation of positions moves ones around without creating or destroying them, so $w(\mathrm{rot}(q))=w(q)$: weight is an invariant of the dynamics. The state space therefore partitions into the weight classes $w=0,1,\dots,N$, and no trajectory ever leaves the class it starts in. Only the class $w=1$, of size $N$, is the intended cycle; the remaining $2^N-N$ states rotate forever through wrong patterns, and all-zeros and all-ones are fixed points. Power-on is exactly this problem — an ASIC flop comes up at an arbitrary value — so a plain ring is correct only if something outside it guarantees the seed. This is the same structural failure as the all-zeros trap of a [[Fibonacci LFSR]], reached by a different argument: there the feedback is linear and $0$ lies in its kernel; here the feedback is a permutation and weight is its conserved quantity.

**Break the invariant by replacing the wrap wire with a NOR.** The wrap $q_0^{+}=q_{N-1}$ is the only edge that carries a one back into the register, so change just that edge:

$$q_i^{+}=q_{i-1}\ \ (1\le i\le N-1),\qquad q_0^{+}=\overline{q_0\vee q_1\vee\dots\vee q_{N-2}}$$

Write $m=\sum_{j=0}^{N-2}q_j$ for the weight of the $N-1$ bits that actually survive the shift — the old $q_{N-1}$ is overwritten by $q_{N-2}$ and is discarded. Those $m$ ones move up unchanged, and the NOR injects one more one exactly when $m=0$, since by De Morgan $\overline{\bigvee_j q_j}=\bigwedge_j\overline{q_j}$, i.e. "all of them are zero". So

$$w^{+}=m+[\,m=0\,],\qquad m=w-q_{N-1}$$

which splits into three cases. If $m=0$ then $w^{+}=1$, so the dead state $0$ and the legal state $2^{N-1}$ both land in the one-hot class. If $m\ge1$ then $w^{+}=m\le w$, with strict decrease whenever $q_{N-1}=1$. Weight is therefore a Lyapunov function: non-increasing always, strictly decreasing on every cycle in which a one falls off the top. Any state with $w\ge2$ has a one at some position $j\le N-2$, which reaches the top in $N-1-j$ steps, so the decrease cannot stall; the worst case is a one at position $N-2$, giving convergence to the one-hot cycle within $N-1$ clocks from *any* start state. The price of that guarantee is one $(N-1)$-input NOR and nothing else — no reset network, no state machine, no lock detector.

> [!warning] Index slip in the long-form source
> [[2.8) Counters]] writes the correction as $q_0^{+}=\overline{q_1+q_2+\dots+q_{N-1}}$. That right-hand side excludes $q_0$ rather than the bit the feedback replaces, and with the up-shift used here it fails immediately: from $q=001$ it gives $\overline{q_1\vee q_2}=1$ while $q_1^{+}=q_0=1$, i.e. the state $011$, and one-hotness is destroyed on the first clock. The expression is correct for the *opposite* shift direction ($q_i^{+}=q_{i+1}$), where it belongs on $q_{N-1}^{+}$, not on $q_0^{+}$. The direction-free statement is the one to remember: **NOR the $N-1$ bits other than the one the feedback replaces.** The simulation below exercises all $2^8$ start states against this form.

**Count what the correction costs in time, and where it lands.** With the plain wrap the combinational depth is literally zero, so $f_{\max}=t_{cq}+t_{su}$ — the flop's own toggle limit, independent of $N$, and unbeatable by any counter that computes anything. The NOR sits in the D path of $q_0$ only, so the other $N-1$ flops keep that pure limit and the register's limit becomes $t_{cq}+t_{\text{NOR}(N-1)}+t_{su}$. Since $f_{\max}$ is set by the worst path, the correction is not free: an $(N-1)$-input NOR is built as a tree of depth $\lceil\log_k(N-1)\rceil$ in whatever fan-in $k$ the library supports, so the penalty grows logarithmically with the state count. For wide rings the cheaper trade is to drop the NOR and rely on the reset, accepting that a single upset bit is then unrecoverable. Clock power is $N$ flops clocked but only two toggling per step — one falling, one rising — against roughly $N/2$ toggling in a binary counter, so the datapath switching is $O(1)$ per cycle while the clock-tree load is $O(N)$.

**On FPGA the two advantages are mutually exclusive, and that is the whole mapping decision.** A ring needs no arithmetic, so it needs no carry chain, and an `SRL16`/`SRL32` collapses a 16- or 32-deep shift register with its feedback into a *single* LUT — the cheapest sequencer on the die, and far below $N$ slice flops ([[Lookup-Tables]], [[FPGAs]]). But an SRL exposes only its addressed output, not all $N$ taps, so the free parallel decode is gone: you get a delay line, not a phase generator. Choose the SRL when the ring is a sequencer whose position is read one phase at a time, and the flop-based form of the diagram when every $\phi_k$ must be visible simultaneously. In the flop-based form the enable is free — every slice flop has a `CE` port — and so is the seed, since the `SR` port loads the flop's configured `INIT` value; that `INIT` is guaranteed at configuration time on FPGA, which is why the NOR is routinely omitted on fabric and is close to mandatory on ASIC. The NOR itself is one 6-LUT for $N\le7$ and a shallow LUT tree beyond that.

$$\boxed{\ q_i^{+}=q_{i-1},\quad q_0^{+}=\overline{\textstyle\bigvee_{j=0}^{N-2}q_j}
\quad\Longrightarrow\quad w^{+}=m+[\,m{=}0\,],\ \ m=w-q_{N-1}\ }$$

**When it breaks**

- **Density fails first and fails hard.** $N$ flops for $N$ states against $\lceil\log_2 N\rceil$; at $N=32$ that is 32 flops against 5. The ring wins on *total* area only while the decoder it eliminates is comparable to the flops it adds, which is a handful of states. Past that a binary counter plus decoder is smaller even after paying for the decoder, and the choice reduces to whether the decode glitch matters.
- **Two bits change per step, so it is not a Gray code and is not CDC-safe.** Sampling a ring across a clock boundary can return a mixture of the old and new words — a state of weight $0$ or $2$, which is not a count at all. A [[Johnson Counter]] changes one bit per step and is CDC-safe over its $2n$ states; a [[Gray Counter]] is the answer above that.
- **Without the NOR there is no recovery from anything, not merely from power-on.** A single upset bit changes the weight class permanently. With the NOR the recovery window is $N-1$ clocks, during which the decoded phases are wrong — silently, with nothing flagging it. If wrong phases are unacceptable during recovery, gating the outputs with a "weight is one" detector costs about as much as the decoder the ring was avoiding.
- **The modulus is the register length.** Changing $N$ means changing the flop count, unlike a [[Modulo-N Counter]] where the terminal count is a constant in a comparator. A ring is a poor choice whenever the modulus is a parameter that might move.
- **Nothing about the state is a number.** There is no increment, no comparison, no offset arithmetic — only "which phase". If the count is ever needed as a quantity, an $N$-to-$\lceil\log_2 N\rceil$ encoder has to be built, which is the decoder cost re-imported at the other end.

**RTL (Spade)**

```spade
fn ring_next<#uint N>(q: uint<N>) -> uint<N> {
    let rot: uint<N> = q << 1;
    let inject: uint<N> = zext((rot == 0).as_uint());
    rot | inject
}

entity ring_counter<#uint N>(clk: clock, rst: bool, en: bool) -> uint<N> {
    reg(clk) q: uint<N> reset(rst: 1) = if en { ring_next(q) } else { q };
    q
}
```

`q` is the flop row of the diagram, one bit per box, and `ring_next` is everything drawn below it. The shift `q << 1` stays $N$ bits wide — shifts do not grow in Spade — so it *is* the chain $q_i^{+}=q_{i-1}$ with the discarded $q_{N-1}$ falling out of the top for free; no `trunc` is needed and no shifter is synthesised, since a constant shift is pure rewiring. The NOR is written `rot == 0`, which is the same predicate: after the shift, `rot` is zero exactly when $q_0\vee\dots\vee q_{N-2}$ was false, so the comparator and the $(N-1)$-input NOR are the identical gate tree and synthesis emits one reduction-OR plus an inverter either way. `reset(rst: 1)` is the one-hot seed, and the `en` mux is what a slice flop's `CE` port absorbs — the 2:1 multiplexer the `if` suggests is not built.

**Related Notes**

- [[Johnson Counter]] – extends: complement the fed-back bit instead of NORing the rest, and get $2n$ states from $n$ flops plus a Gray code.
- [[Synchronous Counters]] – compares: $\lceil\log_2 N\rceil$ flops and an incrementer, then an $N$-output decoder to recover what this circuit gives away free.
- [[Moore]] – supports: one-hot state encoding, where this register *is* the FSM state and the outputs are flop taps.
- [[Synchronous Sequential Logic]] – depends-on: the next-state/output split and the clock-to-Q-plus-setup budget the $f_{\max}$ claim rests on.
- [[Lookup-Tables]] – extends: the `SRL16`/`SRL32` mapping that puts a 32-state ring in one LUT, at the price of the parallel taps.
- [[Fibonacci LFSR]] – compares: the other feedback shift register, with the same dead-state pathology arising from a linear kernel rather than a conserved weight.
- [[Gray Counter]] – counter-example: the CDC-safe choice once the state count outgrows what a ring or a Johnson counter can hold.
- [[Modulo-N Counter]] – compares: a modulus set by a comparator constant rather than by the register length.
- [[Choosing a Counter]] – compares: where this sits against every sibling counter.

## References

- [[2.8) Counters]] — §Ring and Johnson counters (the rotation, the one-hot decode argument, the self-correcting feedback — see the warning above on its index slip), §FPGA mapping (`SRL16`/`SRL32`, free `CE` and `SR`), §Trade-offs (the Ring row: $f_{\max}=t_{cq}+t_{su}$, $N$ flops for $N$ states, zero combinational depth, free glitch-free decode, two flops toggling per cycle, not CDC-safe).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (ring and Johnson counters, self-correcting feedback), Wakerly, *Digital Design: Principles and Practices* (shift-register counters and decoding glitches), and Weste & Harris, *CMOS VLSI Design* (one-hot encoding and multi-phase clock generation). Page numbers are deliberately omitted — no copy was consulted for this note.
