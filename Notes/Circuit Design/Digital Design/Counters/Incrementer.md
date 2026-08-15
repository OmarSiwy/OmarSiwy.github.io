---
title: Incrementer
description: "An n-bit +1 built as a chain of half adders — one XOR2 and one AND2 per bit, roughly half an adder's gates, with the enable absorbed as carry-in and terminal count free as carry-out."
kind: circuit
source: "2.8) Counters §The increment is an adder with one operand tied to 1, §4-bit synchronous up-counter — no book source"
status: seed
spade: simulated
tags: [digital, counters, adder, carry]
aliases:
  - Incrementers
  - Increment
  - Binary Incrementer
---

# Incrementer

An adder with one operand frozen at the constant $1$, which collapses every full adder in the chain to a half adder and makes the enable and the terminal count fall out of the carry rail for nothing.

```tikz title="n-bit incrementer as a chain of half adders, with one slice expanded to its XOR2 and AND2"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- 4-bit chain of half adders, LSB at left, carry flowing right ----
  \foreach \k/\x in {0/0, 1/2.9, 2/5.8, 3/8.7} {
    \draw (\x,1.5) rectangle (\x+1.9,3.0);
    \node at (\x+0.95,2.25) {HA$_\k$};
    \draw[->] (\x+0.95,4.0) -- (\x+0.95,3.0);
    \node[anchor=west] at (\x+1.05,3.75) {$q_\k$};
    \draw[->] (\x+0.95,1.5) -- (\x+0.95,0.5);
    \node[anchor=west] at (\x+1.05,0.75) {$q_\k^{+}$};
  }
  \foreach \x in {1.9, 4.8, 7.7} { \draw[->] (\x,2.25) -- (\x+1.0,2.25); }
  \node[anchor=south] at (2.4,2.3)  {$c_1$};
  \node[anchor=south] at (5.3,2.3)  {$c_2$};
  \node[anchor=south] at (8.2,2.3)  {$c_3$};

  \draw[->] (-1.9,2.25) -- (0,2.25);
  \node[anchor=south] at (-0.95,2.3) {$c_0=\mathrm{EN}$};
  \node[anchor=north] at (-0.95,2.2) {$1$};
  \draw[->] (10.6,2.25) -- (12.5,2.25);
  \node[anchor=south] at (11.55,2.3) {$c_4=\mathrm{TC}$};
  \node[anchor=north] at (11.55,2.2) {$1$};

  \node[anchor=west] at (-1.9,4.4) {$q$ : $n$ bits in, $q^{+}$ : $n$ bits out, one bit per slice};

  % ---- one slice expanded ----
  \draw[dashed,gray] (5.8,1.5) -- (4.2,-1.0);
  \draw[dashed,gray] (7.7,1.5) -- (11.6,-1.0);
  \draw[dashed] (4.2,-1.0) rectangle (11.6,-4.6);
  \node[anchor=west] at (4.3,-1.35) {HA$_i$ : one XOR2 $+$ one AND2};

  \node[xor port] (X) at (7.3,-2.2) {};
  \node[and port] (A) at (7.3,-3.9) {};

  % q_i spine (left), feeds the lower input of both gates
  \draw (5.3,-1.7) -- (5.3,-4.15);
  \draw (5.3,-2.45) -- (X.in 2);
  \draw (5.3,-4.15) -- (A.in 2);
  \fill (5.3,-2.45) circle (1.6pt);
  \node[anchor=east] at (5.25,-1.75) {$q_i$};

  % carry spine (right of it), feeds the upper input of both gates
  \draw (6.0,-3.65) -- (6.0,-1.95);
  \draw (6.0,-1.95) -- (X.in 1);
  \draw (6.0,-3.65) -- (A.in 1);
  \fill (6.0,-3.65) circle (1.6pt);
  \draw[->] (4.4,-3.65) -- (6.0,-3.65);
  \node[anchor=south] at (5.0,-3.6) {$c_i$};

  \draw[->] (X.out) -- (11.3,-2.2);
  \node[anchor=south west] at (8.4,-2.15) {$q_i^{+}=q_i\oplus c_i$};
  \draw[->] (A.out) -- (11.3,-3.9);
  \node[anchor=south west] at (8.4,-3.85) {$c_{i+1}=q_i\,c_i$};

\end{circuitikz}
\end{document}
```

**Freeze one operand and the full adder degenerates.** Start from the full adder of [[Adders]], with $a_i,b_i,c_i$ all $1$ bit:

$$s_i=a_i\oplus b_i\oplus c_i,\qquad c_{i+1}=a_ib_i+c_i(a_i\oplus b_i)$$

An increment is $A+B$ with $B=1$, i.e. $b_0=1$ and $b_i=0$ for $i>0$. Rather than special-casing bit $0$ — which would leave the chain non-uniform and unfit for a `\foreach` — absorb the constant into the carry-in: $A+1=A+0+c_0$ with $c_0=1$. Now **every** $b_i=0$, and by the identities $x\oplus0=x$ and $x\cdot0=0$ the two expressions collapse to

$$s_i=a_i\oplus c_i,\qquad c_{i+1}=a_ic_i$$

which is a **half adder**. The $n$-bit incrementer is therefore $n$ half adders — one XOR2 and one AND2 per bit — where a general $n$-bit [[RCA, Ripple-Carry Adder]] needs $n$ full adders, each of which is two XOR2 plus the majority term. Roughly half the gates, and that halving is the entire reason a counter is cheaper than an accumulator that happens to add $1$.

**Unroll the carry and the recurrence has a closed form.** The chain $c_{i+1}=a_ic_i$ is a bare AND recurrence with no generate term to restart it, so by induction on $i$, with $c_0=\text{EN}$ and the state bits $a_i=q_i$:

$$c_i=\text{EN}\cdot\!\!\prod_{j<i}q_j$$

Substituting into $s_i=q_i\oplus c_i$ gives the toggle form directly. In words: **bit $i$ toggles when the enable is high and every lower bit is $1$**, which is the same statement as "the trailing run of ones inverts and the first zero absorbs the carry". Two free lunches follow. The enable is not a mux select on the state — it is $c_0$, a single AND-input's worth of hardware fed into a wire that already exists, so a gated incrementer costs the same as an ungated one. And the terminal count $\text{TC}=c_n$ is the carry-out of the last slice, already computed: the all-ones detect that a naive design would build as a separate $n$-input AND is sitting at the end of the chain, $1$ bit wide, for zero extra gates.

**Cost and delay are the ripple-carry ones with the generate rail deleted.** Area is $n$ XOR2 $+\;n$ AND2; carry depth is $(n-1)\,t_{\text{AND}}+t_{\text{XOR}}$, linear in $n$, because each slice's AND cannot fire until the one below it has. That linear term is what puts an incrementer on the critical path of a fast [[Synchronous Counters|synchronous counter]] and what every alternative in this folder is trying to remove.

**Lookahead degenerates in exactly the same way.** In generate/propagate form ([[CLA, Carry-Lookahead Adder]]) $g_i=a_ib_i$ and $p_i=a_i\oplus b_i$; with $b_i=0$ these become $g_i=0$ and $p_i=a_i$. Since the prefix operator

$$(g,p)\circ(g',p')=(g+pg',\;pp')$$

is $(0,pp')$ whenever both generates vanish, and $\circ$ is associative, the carry problem is a **pure AND-prefix** — the same tree as a parallel-prefix adder with $\circ$ replaced by AND, depth $\lceil\log_2 n\rceil$, and roughly half the wires because the $g$ rail no longer exists. That is [[Prefix Incrementer]]; do not re-derive the tree here.

**Down-counting is the same circuit run on the complemented state.** By the two's-complement identity $\overline{X}=2^n-1-X$ from [[Number Formats]],

$$\overline{\overline{Q}+1}=2^n-1-\big(2^n-1-Q+1\big)=Q-1 \pmod{2^n}$$

so complementing $q_j$ inside the product replaces "every lower bit is $1$" with "every lower bit is $0$". One XOR per AND input, controlled by a $1$-bit direction signal, buys both directions in one datapath — see [[Up-Down Counter]]. On a LUT fabric that XOR is absorbed into the same LUT that already computes the toggle term; on an ASIC it is one real gate per bit.

**On FPGA the chain is not built from your gates at all.** The synthesiser recognises $q+1$ and maps it onto the hardened carry chain, one LUT and one carry-chain multiplexer per bit, with the dedicated carry route rather than general interconnect between slices ([[FPGAs]]). The consequence is that the $O(n)$ carry depth carries a very small constant, and the prefix form — which needs general routing for its tree — loses to the ripple form to surprising widths. On an ASIC there is no hardened chain, the constant is a real gate delay, and static timing decides between the two much earlier. Same algebra, opposite conclusion; this is the standard trap in porting counter RTL between the two targets.

**Trace four bits and the structure is visible.** Substituting $n=4$ into the toggle form, and noting each toggle term is the previous one ANDed with one state bit:

$$
\begin{aligned}
q_0^{+}&=q_0\oplus\text{EN} & t_0&=\text{EN}\\
q_1^{+}&=q_1\oplus(\text{EN}\,q_0) & t_1&=t_0\,q_0\\
q_2^{+}&=q_2\oplus(\text{EN}\,q_0q_1) & t_2&=t_1\,q_1\\
q_3^{+}&=q_3\oplus(\text{EN}\,q_0q_1q_2) & t_3&=t_2\,q_2\\
\text{TC}&=\text{EN}\,q_0q_1q_2q_3 & &=t_3\,q_3
\end{aligned}
$$

Four AND2 and four XOR2, and the $t$ column *is* the carry chain. With $\text{EN}=1$, writing $Q=q_3q_2q_1q_0$ and $T=t_3t_2t_1t_0$:

| $Q$ | $q_0$ | $q_1$ | $q_2$ | $T$ | $Q^{+}$ | TC |
| --- | --- | --- | --- | --- | --- | --- |
| $0110$ | 0 | 1 | 1 | $0001$ | $0111$ | 0 |
| $0111$ | 1 | 1 | 1 | $1111$ | $1000$ | 0 |
| $1000$ | 0 | 0 | 0 | $0001$ | $1001$ | 0 |
| $1111$ | 1 | 1 | 1 | $1111$ | $0000$ | **1** |

Row two flips all four bits at once — the worst case for the carry chain, and the transition that makes a binary count unsafe to sample across a clock boundary ([[Gray Counter]]). The last row is the wrap: $Q^{+}=Q+1 \bmod 2^4$, exact, $0$ ulp, with the carry-out not lost but published as TC.

$$\boxed{\ q_i^{+}=q_i\oplus\Big(\text{EN}\cdot\!\!\prod_{j<i}q_j\Big),\qquad \text{TC}=c_n=\text{EN}\cdot\!\!\prod_{j<n}q_j\ }$$

**When it breaks**

- **It only adds $1$.** Any other constant reintroduces $g_i=a_ib_i\ne0$ on the bits where the constant is $1$, and the half adders on those bits become full adders again. A constant with $k$ ones costs $k$ full adders; at $k$ near $n$ you have built an adder and should have instantiated one.
- **Linear depth stops being free early on ASIC.** The crossover against [[Prefix Incrementer]] is where $(n-1)t_{\text{AND}}$ exceeds $\lceil\log_2 n\rceil t_{\text{AND}}$ plus the tree's routing, which on general interconnect is small $n$; on FPGA the hardened chain pushes it out far enough that the ripple form usually wins outright.
- **Wrapping is silent.** $q^{+}=q+1 \bmod 2^n$ discards nothing only because TC carries the overflow out; ignore TC and a full count is indistinguishable from a fresh one. Any modulus that is not $2^n$ needs an explicit compare and reset ([[Modulo-N Counter]]).
- **TC is combinational.** It is the top of the carry chain, so it glitches while the chain settles and it is *not* "the counter has reached its last value, registered". Feeding a raw TC into an enable or an asynchronous port propagates the glitch; register the condition instead, computing it from the next state.
- **Chaining slices is not free even though TC is.** Driving the next slice's EN with this slice's TC puts the whole carry chain of every slice in series ([[Cascaded Counter Chain]]); a parallel-enable structure keeps depth constant at the cost of a wide AND per slice.

**RTL (Spade)**

```spade
fn incr<#uint N>(q: uint<N>, en: bool) -> (uint<N>, bool) {
    let c0: uint<N> = if en { 1 } else { 0 };
    let sum = q + c0;
    (trunc(sum), sum.msb())
}
```

`q` is the $n$-bit word entering the top of the diagram and `c0` is the carry-in labelled EN — written as a value rather than a flag because Spade's `+` takes two operands of equal width, so the enable is zero-extended to $n$ bits and the synthesiser propagates the constant back into the LSB slice. `q + c0` is `uint<{N+1}>`: `trunc` takes the $n$ sum bits $q^{+}$ and `sum.msb()` is $c_n$, i.e. TC, which is why both fall out of one expression rather than two. The block is purely combinational — no `reg`, because the incrementer is not the counter; the state register belongs to [[Synchronous Counters]]. What synthesis does differently from the drawing is refuse to build the drawing: it will emit a carry-chain primitive, not $n$ discrete half adders, and on FPGA that is one LUT plus one carry mux per bit.

**Related Notes**

- [[Adders]] – depends-on: the full adder this is a degenerate case of, and the source of $s_i$ and $c_{i+1}$.
- [[RCA, Ripple-Carry Adder]] – compares: the same carry chain with the generate rail intact, twice the gates per bit.
- [[CLA, Carry-Lookahead Adder]] – supports: the $(g,p)$ formulation whose degeneration to a pure AND-prefix is derived above.
- [[Prefix Incrementer]] – extends: reassociates this chain into a depth-$\lceil\log_2 n\rceil$ AND tree.
- [[Synchronous Counters]] – extends: wraps this block in a register to make a counter, and inherits its carry depth as $t_{\text{logic}}$.
- [[Up-Down Counter]] – extends: the complemented-state derivation, both directions in one datapath.
- [[Cascaded Counter Chain]] – extends: TC as the enable of the next slice, and what that costs in depth.
- [[Number Formats]] – depends-on: two's complement and the $\bmod 2^n$ wrap the increment is exact under.
- [[Choosing a Counter]] – compares: where the ripple increment sits against every sibling structure.

## References

- [[2.8) Counters]] — §The increment is an adder with one operand tied to 1 (degeneration to half adders, closed-form carry, prefix degeneration, down-counting) and §Worked example, 4-bit synchronous up-counter (the toggle table and trace).
- No textbook source for this topic. Standard in Mano & Ciletti, *Digital Design* (registers and counters), Wakerly, *Digital Design: Principles and Practices* (the 74x161/163 enable and carry structure), and Weste & Harris, *CMOS VLSI Design* (incrementers as degenerate adders). Page numbers are omitted deliberately — no copy was consulted while writing.
