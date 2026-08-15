---
title: "Up-Down Counter"
description: "One datapath both directions: XOR the direction bit into each toggle product, so bit i flips when all lower bits are 1 (up) or all 0 (down) — one literal per AND input, free on a LUT fabric."
kind: circuit
source: "2.8) Counters §The increment is an adder with one operand tied to 1 — no book source"
status: seed
spade: simulated
tags: [digital, counters, updown, incrementer, fpga]
aliases:
  - Up/Down Counter
  - Up-Down Counters
  - Bidirectional Counter
  - Reversible Counter
---

# Up-Down Counter

A synchronous counter that reaches both directions from a single toggle network, by complementing the state bits that feed the carry chain instead of duplicating the chain.

```tikz title="Up-down counter bit slice: direction XOR on the AND-chain inputs, toggle XOR on the state"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex,scale=0.8,transform shape]

  % ---- direction rail ----
  \draw (-2.2,6.2) -- (15.9,6.2);
  \node[left] at (-2.25,6.2) {$\overline{\mathrm{UP}}$};

  \foreach \i [evaluate=\i as \X using 5.2*\i] in {0,1,2} {
    \node[xor port] (xd\i) at (\X+2.2,5.2) {};
    \node[and port] (a\i)  at (\X+4.4,3.6) {};
    \node[xor port] (xt\i) at (\X+2.2,2.0) {};

    % state flop
    \draw (\X+3.25,1.45) rectangle (\X+4.4,2.55);
    \node at (\X+3.83,2.18) {$q_\i$};
    \node at (\X+3.83,1.78) {\scriptsize D\,--\,Q};

    % toggle XOR -> flop D ; flop Q -> output column
    \draw (xt\i.out) -- (\X+3.25,2.0);
    \draw (\X+4.4,2.0) -- (\X+4.55,2.0);
    \draw[->] (\X+4.55,2.0) -- (\X+4.55,-1.4);
    \node[below] at (\X+4.55,-1.4) {$q_\i$};

    % feedback riser: Q back to both XORs
    \fill (\X+4.55,0.5) circle (1.6pt);
    \draw (\X+4.55,0.5) -- (\X-0.15,0.5);
    \draw (\X-0.15,0.5) |- (xd\i.in 2);
    \draw (\X-0.15,0.5) |- (xt\i.in 2);
    \fill (\X-0.15,0.5 |- xt\i.in 2) circle (1.6pt);

    % direction bit into the upper XOR
    \fill (\X+0.4,6.2) circle (1.6pt);
    \draw (\X+0.4,6.2) |- (xd\i.in 1);

    % m_i down into the AND
    \draw (xd\i.out) -- (\X+3.2,5.2) -- (\X+3.2,0 |- a\i.in 1) -- (a\i.in 1);
    \node[above] at (\X+2.75,5.2) {\scriptsize$m_\i$};

    % carry tap into the toggle XOR
    \fill (\X+0.9,0 |- a\i.in 2) circle (1.6pt);
    \draw (\X+0.9,0 |- a\i.in 2) |- (xt\i.in 1);
    \node[above] at (\X+1.5,0 |- a\i.in 2) {\scriptsize$c_\i$};
  }

  % ---- carry chain ----
  \draw (-2.2,0 |- a0.in 2) -- (a0.in 2);
  \node[left] at (-2.25,3.35) {$\mathrm{EN}=c_0$};
  \draw (a0.out) -| (5.6,3.35) -- (a1.in 2);
  \draw (a1.out) -| (10.8,3.35) -- (a2.in 2);
  \draw[->] (a2.out) -- (15.9,3.6);
  \node[above] at (15.5,3.62) {TC $=c_n$};
  \node at (15.5,2.0) {$\cdots$};

  \node[anchor=west] at (-2.2,-2.4)
    {every wire drawn is 1 bit; the state word $q$ is $n$ bits, as is the load port $d$ (mux omitted)};
  \node[anchor=west] at (-2.2,-3.0)
    {$m_i=q_i\oplus\overline{\mathrm{UP}}$, \qquad $c_{i+1}=c_i\wedge m_i$, \qquad $q_i^{+}=q_i\oplus c_i$};

\end{circuitikz}
\end{document}
```

**Start from the increment, which is already a chain of AND gates.** From [[Incrementer]], tying one adder operand to zero and folding the constant into the carry-in collapses each full adder to a half adder, $s_i=q_i\oplus c_i$ with $c_{i+1}=q_i c_i$, and unrolling that recurrence from $c_0=\text{EN}$ gives the closed form $c_i=\text{EN}\cdot\prod_{j<i}q_j$. All $n$ state bits $q_i$, the toggle vector $t$ and the carry rail $c$ are $1$ bit per slice; $\text{EN}$, $\text{UP}$, $\text{LD}$ and $\text{TC}$ are $1$ bit each; the state word $q$ and the load port $d$ are $n$ bits. The circuit is an AND-prefix over the state bits with an XOR hung off each prefix — nothing else.

**Get the down direction from the two's-complement identity, not from a second chain.** By $\overline{X}=2^n-1-X$ ([[Number Formats]]),

$$\overline{\overline{Q}+1}\;=\;2^n-1-\big(2^n-1-Q+1\big)\;=\;Q-1 \pmod{2^n}$$

so decrementing is *complement, increment, complement*. Written naively that is three pieces of hardware, two of which are $n$ inverters, and it would sit beside the incrementer behind an output mux — two chains, one wasted every cycle.

**Kill the outer complement with $\neg(x\oplus y)=(\neg x)\oplus y$.** Let $u=\overline{q}$ and run the increment on it: $u^{+}_i=u_i\oplus t_i$ with $t_i=\text{EN}\cdot\prod_{j<i}u_j$. The result we want is $\overline{u^{+}}$, and complementing an XOR is the same as complementing one of its inputs, so

$$q^{-}_i \;=\; \overline{u_i\oplus t_i} \;=\; \overline{u_i}\oplus t_i \;=\; q_i\oplus t_i$$

The output inverters cancel against the input inverters, because XOR is affine over $\mathbb{F}_2$ and complementation is $\oplus 1$: the constant passes straight through the XOR and lands back on $q$. What survives is the complement *inside* the product, $t_i=\text{EN}\cdot\prod_{j<i}\overline{q_j}$ — **bit $i$ toggles when every lower bit is $0$**, the exact mirror of the up rule.

**Merge the two rules with one conditional complement per bit.** The up rule needs $q_j$ in the product and the down rule needs $\overline{q_j}$; a controllable inverter is an XOR with the control, so define $m_j=q_j\oplus\overline{\text{UP}}$ and use $m$ everywhere the increment used $q$:

$$t_i=\text{EN}\cdot\!\!\prod_{j<i} m_j,\qquad q_i^{+}=q_i\oplus t_i,\qquad \text{TC}=c_n=\text{EN}\cdot\!\!\prod_{j<n} m_j$$

$\text{UP}=1$ gives $m_j=q_j$ and $\text{UP}=0$ gives $m_j=\overline{q_j}$, so one datapath serves both and the mux at the output is gone. The terminal count is the same wire in both directions — it is "all ones" when counting up and "all zeros" when counting down, without a second comparator, because it is the carry-out of a chain whose inputs already carry the direction.

> [!note] The enable is the identity element, not a mux.
> $\text{EN}$ enters as $c_0$, the seed of the AND-prefix, so $\text{EN}=0$ zeroes every $t_i$ and every state bit holds by $q_i\oplus0=q_i$. No hold mux, no clock gate, no extra fan-in — the algebra already had a slot for it. The "add $\pm1$" formulation below does not: there, disabling means forcing the addend to zero *and* the carry-in to zero, which is two gates rather than none.

**Count the cost, and note that it is one gate deep, not one gate per level.** Against the plain [[Incrementer]] the addition is exactly $n$ XOR2 gates, one per AND input, plus fan-out $n$ on $\text{UP}$. They all sit in the *same* level — $m$ is computed once, in parallel, before the chain — so the critical path grows by a single XOR delay regardless of how the prefix is built:

$$T_{\text{clk}}\;\ge\;t_{cq}+\underbrace{t_{\text{XOR}}}_{\text{direction}}+\;(n-1)\,t_{\text{AND}}+t_{\text{XOR}}\;+t_{su}+t_{\text{skew}}$$

and with the linear chain replaced by an AND-prefix tree ([[Prefix Incrementer]]) the $(n-1)\,t_{\text{AND}}$ becomes $\lceil\log_2 n\rceil\,t_{\text{AND}}$ with the direction XOR still costing one level in front of it. The one real caveat is arrival time: $\text{UP}$ feeds the *input* of the whole prefix network, so a late-arriving direction signal costs the full chain depth after it settles. Register it, or drive it from a slow control path with margin.

**On FPGA the XOR is free, and the synthesiser finds it without being told.** Write the counter behaviourally as $q + (\text{UP}\,?\,1:-1)$ and the tool maps it to the hard carry chain, whose propagate input is fed by a LUT that would otherwise pass $q_i$ through unchanged. Since $-1=2^n-1$ is the all-ones word, the second operand is $b_i=\overline{\text{UP}}$ for every $i$, and the propagate the LUT must produce is $p_i=q_i\oplus b_i=q_i\oplus\overline{\text{UP}}$ — literally $m_i$. A two-input function occupies the same 6-LUT as a one-input function, so the direction costs zero LUTs, zero levels, and zero carry-chain length ([[FPGAs]]). The carry rail differs in polarity between the two views — counting down, the hard chain propagates the complement of the borrow — but the sum bits it emits are identical, so nothing in the mapping has to change. On an ASIC the XOR is real: $n$ gates, and a buffer tree on $\text{UP}$ whose depth is logarithmic in $n$.

**Loading is the one thing that does not fold in.** $q_i^{+}=\text{LD}\,?\,d_i:(q_i\oplus t_i)$ is a genuine 2:1 mux per bit, and unlike the enable it has no algebraic hiding place, because loading is not a toggle. It lands on the critical path between the toggle XOR and the flop's D input unless the library flop has a native load port or the mux merges into the same LUT as the XOR — on a 6-LUT the function $(q_i,t_i,\text{LD},d_i)$ is four inputs and fits, so on FPGA the load is again free; on ASIC it is one mux delay added to every path.

$$\boxed{\ t_i=\text{EN}\cdot\!\!\prod_{j<i}\big(q_j\oplus\overline{\text{UP}}\big),\qquad q_i^{+}=q_i\oplus t_i\ }$$

**When it breaks**

- **$\text{TC}$ glitches when $\text{UP}$ moves.** The terminal count is combinational on $(q,\text{EN},\text{UP})$, so a direction change re-evaluates the whole AND chain and $\text{TC}$ can pulse on the way. Harmless into a flop's D input, fatal into an asynchronous port or a strobe — register the decode, exactly as in [[Synchronous Counters]].
- **Modulo-$N$ needs two wrap conditions, not one.** Counting up wraps at $N-1\to0$ and counting down at $0\to N-1$; the direction that is idle still has to be detected. That is two comparators plus a load path, and the elegance of the shared chain stops at the wrap logic ([[Modulo-N Counter]], [[Zero-Detect Down Counter]]).
- **The ripple structure cannot do this at all.** In an [[Asynchronous Counters|asynchronous counter]] the toggle condition lives in the *time* domain, so reversing direction means clocking stage $i$ from $\overline{Q_{i-1}}$ instead of $Q_{i-1}$ — a mux on a clock, which glitches into a spurious edge the moment $\text{UP}$ changes. Bidirectional counting is a reason to be synchronous.
- **Width where the linear chain stops being acceptable** is the same as for the incrementer, since the direction XOR adds a constant: past roughly $n=8$ on an ASIC at aggressive $f$, the $(n-1)\,t_{\text{AND}}$ term dominates and the prefix form takes over. On FPGA the hardened chain pushes that crossover far out — the linear form is usually right to $n=32$ and beyond.
- **Nothing here says the sequence is reversible in time.** Toggling $\text{UP}$ while $\text{EN}$ is high retraces the count only if $\text{UP}$ is stable at each edge; treat it as an ordinary synchronous datapath control and the timing analysis is ordinary too.

**RTL (Spade)**

```spade
entity updown<#uint N>(clk: clock, rst: bool, en: bool, up: bool,
                       ld: bool, d: uint<N>) -> (uint<N>, bool) {
    decl q_next;
    reg(clk) q: uint<N> reset(rst: 0) = q_next;

    let zero: uint<N> = 0;
    let ones = ~zero;
    let mask: uint<N> = if up { zero } else { ones };
    let m = q ^ mask;
    let t: uint<N> = if en { m ^ (m +. 1) } else { zero };
    let q_next: uint<N> = if ld { d } else { q ^ t };
    (q, en && m == ones)
}
```

`mask` is the replicated $\overline{\text{UP}}$ of the direction rail and `m` is the wire labelled $m_i$ in the drawing; `t` is the toggle vector, i.e. the carry rail $c$ shifted by one position. The toggle vector is written as `m ^ (m +. 1)` rather than as an explicit AND-prefix because $m\oplus(m+1)$ *is* the run of trailing ones plus the first zero — the set of positions where the carry reached — and Spade has no `gen for` with which to spell out the prefix bit by bit; `+.` is the truncating add, so the wrap at $2^n$ is intentional rather than an overflow. Everything except the `reg` is combinational, and `d`/`ld` form the load mux the diagram omits. Synthesis will not build a literal adder here: given `m + 1` on an FPGA it emits the hard carry chain described above, and on an ASIC the AND chain, in both cases discarding the sum in favour of the carries.

Compiled and simulated (`.zettel/sim.sh`, `N=8`): named vectors covering the asymmetric pair $1$ and $128$, both wrap directions ($0-1\to255$, $255+1\to0$), enable-low holds, and $3000$ random steps of $(\text{en},\text{up},\text{ld},d)$ against a behavioural `up ? q+1 : q-1` reference — no mismatches, `TC` checked on every step.

**Related Notes**

- [[Incrementer]] – extends: the up-only chain this note complements one input of; every cost figure here is that one plus a constant.
- [[Number Formats]] – depends-on: $\overline{X}=2^n-1-X$, the identity that turns a decrement into an increment.
- [[Synchronous Counters]] – depends-on: the timing constraint the direction XOR is added to, and the registered-decode rule that $\text{TC}$ needs.
- [[Prefix Incrementer]] – extends: replaces the linear AND chain with a tree; the direction XOR stays one level in front of it.
- [[Modulo-N Counter]] – compares: where the shared datapath stops paying, since each direction needs its own wrap detector.
- [[Asynchronous Counters]] – counter-example: the same function is unbuildable there, because direction becomes a mux on a clock.
- [[Zero-Detect Down Counter]] – compares: down-only, where the all-zeros condition is the point rather than a mirrored case.
- [[Choosing a Counter]] – compares: where this sits against every sibling.

## References

- [[2.8) Counters]] — §The increment is an adder with one operand tied to 1 (half-adder collapse, unrolled carry, the down-counting identity, the shared-datapath toggle equation, loading) and §Synchronous counters (the $T_{\text{clk}}$ constraint and the registered-decode rule).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (up-down and up-down-with-load counters), Wakerly, *Digital Design: Principles and Practices* (the 74x169 family and enable/TC chaining), and Weste & Harris, *CMOS VLSI Design* (increment and prefix structures). Page numbers are deliberately omitted — no copy was consulted for this note.
