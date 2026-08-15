---
title: De Bruijn Counter
description: "An LFSR with an all-zeros detect XNORed into the feedback, splicing the missing state into the cycle for a full period of 2^n — costs one (n-1)-input NOR."
kind: circuit
source: "2.8) Counters §LFSR counters — no book source"
status: seed
spade: simulated
tags: [digital, counters, lfsr, shift-register, sequence]
aliases:
  - De Bruijn Counters
  - de Bruijn Sequence Generator
  - Full-Period LFSR
  - Modified LFSR Counter
---

# De Bruijn Counter

A maximal-length LFSR whose feedback is inverted on exactly the two states with an all-zero tail, which splices the unreachable all-zeros state into the cycle and makes the period $2^n$ rather than $2^n-1$.

```tikz title="De Bruijn counter: 4-bit Fibonacci LFSR for p(x)=x^4+x+1 with an all-zeros detect XORed into the feedback"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- shift register chain, n = 4 flops, 1 bit each ---
  \foreach \i/\lbl in {0/0,1/1,2/2,3/3} {
    \pgfmathsetmacro\x{2.2*\i}
    \draw (\x,0) rectangle (\x+1.4,1.2);
    \node at (\x+0.7,0.6) {$s_{\lbl}$};
  }
  \foreach \i in {0,1,2} {
    \pgfmathsetmacro\x{2.2*\i}
    \draw[->] (\x+1.4,0.6) -- (\x+2.2,0.6);
  }
  \draw[->] (8.0,0.6) -- (9.0,0.6);
  \node[right] at (9.05,0.6) {$s_3$ \, / \, $1$};
  \node[anchor=west] at (2.7,-0.6) {1 bit per stage; $s$ is $n$ bits};

  % --- feedback gates ---
  \draw (-3.4,0.6) circle (0.35);  \node at (-3.4,0.6) {$\oplus$};
  \draw (-1.7,0.6) circle (0.35);  \node at (-1.7,0.6) {$\oplus$};
  \draw[->] (-3.05,0.6) -- (-2.05,0.6);
  \node[above] at (-2.55,0.62) {$f$};
  \draw[->] (-1.35,0.6) -- (0,0.6);
  \node[above] at (-0.7,0.62) {$f'$};

  % tap s_0 into the taps XOR
  \fill (1.7,0.6) circle (1.4pt);
  \draw (1.7,0.6) -- (1.7,-1.0) -- (-3.4,-1.0) -- (-3.4,0.25);
  \node[above] at (-0.2,-1.0) {tap $s_0$};

  % tap s_3, the bit shifted out, into the taps XOR
  \fill (8.5,0.6) circle (1.4pt);
  \draw (8.5,0.6) -- (8.5,-2.0) -- (-4.4,-2.0) -- (-4.4,0.6) -- (-3.75,0.6);
  \node[above] at (-0.2,-2.0) {tap $s_3$};

  % --- all-zeros detect on the low n-1 bits, spliced into the feedback ---
  \draw (-3.0,1.50) rectangle (-0.5,2.48);
  \node at (-1.75,2.00) {$\overline{s_2+s_1+s_0}$};
  \node[above] at (-1.75,2.53) {all-zeros detect, $(n{-}1)$-input NOR};

  \draw (1.7,0.6) -- (1.7,1.70) -- (-0.5,1.70);
  \fill (3.9,0.6) circle (1.4pt);
  \draw (3.9,0.6) -- (3.9,1.95) -- (-0.5,1.95);
  \fill (6.1,0.6) circle (1.4pt);
  \draw (6.1,0.6) -- (6.1,2.20) -- (-0.5,2.20);

  \draw[->] (-1.7,1.45) -- (-1.7,0.95);
  \node[right] at (-1.62,1.22) {$Z$ \, / \, $1$};

\end{circuitikz}
\end{document}
```

**Start from the defect, not from the fix.** A Fibonacci LFSR ([[Fibonacci LFSR]]) holds an $n$-bit state $s=s_{n-1}\ldots s_0$ and updates by

$$s^{+}=(s\ll1)\ \vert\ f,\qquad f=\bigoplus_{i\in T}s_i$$

with the 1-bit feedback $f$ entering at $s_0$, the 1-bit $s_{n-1}$ falling off the top, and the tap set $T$ read off a primitive $p(x)$ of degree $n$ over $\mathrm{GF}(2)$. Primitivity buys period $2^n-1$: every state except $0\ldots0$, exactly once. The exception is not an edge case but a structural consequence — $f=\bigoplus_i 0=0$ by the annihilating property of $0$ under XOR, so $0\ldots0\mapsto0\ldots0$ is a fixed point, and a counter that reaches it stops counting silently. The usual mitigation is a non-zero reset value, which costs nothing but leaves the count one short of a power of two and leaves the dead state one glitch away.

**Flip the feedback on exactly the states that see an all-zero tail.** Define the 1-bit detect over the $n-1$ bits that are *not* shifted out,

$$Z=\overline{s_{n-2}\vee s_{n-3}\vee\cdots\vee s_0},\qquad f'=f\oplus Z$$

and drive $s_0^{+}=f'$. By De Morgan the detect is one $(n-1)$-input NOR or, equivalently, an OR whose result is XNORed with $f$ — $f\oplus\bar{x}=\overline{f\oplus x}$, so the two forms are the same gate count and you buy whichever polarity the library is cheaper in. Exactly two of the $2^n$ states satisfy $Z=1$, namely $0\ldots0$ and $10\ldots0$, because $Z$ constrains $n-1$ bits and leaves $s_{n-1}$ free. Everywhere else $f'=f$ and the circuit is bit-for-bit the original LFSR.

**Check that the modified map is still a bijection, or "period" means nothing.** A next-state function on a finite set decomposes the state graph into disjoint cycles *if and only if* it is injective; otherwise there are merging paths and transient tails, and a counter can leave a cycle it can never re-enter. Invert $s^{+}$: its top $n-1$ bits are $s_{n-2}\ldots s_0$ verbatim, so $Z$ is computable from $s^{+}$ alone, and $f=s^{+}_0\oplus Z$ recovers the pre-splice feedback. Since $p$ has degree $n$ its leading term is $x^{n}$, so $n-1\in T$ and $f=s_{n-1}\oplus\bigoplus_{i\in T\setminus\{n-1\}}s_i$ where every remaining term is already known — one more XOR recovers $s_{n-1}$. The map is invertible, so the graph is a union of cycles.

**Splicing is one application of the cycle-joining lemma.** If a permutation $\sigma$ has $a$ and $b$ in *different* cycles, the permutation obtained by exchanging their images — $a\mapsto\sigma(b)$, $b\mapsto\sigma(a)$ — merges the two cycles into one of the combined length; if they were in the same cycle it splits into two. Here $a=10\ldots0$ and $b=0\ldots0$ are the only two states the detect touches, and flipping $f$ at both is precisely that exchange: $10\ldots0$ sent to $0\ldots0$ instead of $0\ldots01$, and $0\ldots0$ sent to $0\ldots01$ instead of itself. They lie in different cycles by construction — one in the $(2^n-1)$-cycle, one in the length-1 cycle — so the result is a single cycle of length

$$(2^n-1)+1=2^n$$

**One extra state changes what the reset means.** All-zeros is now an ordinary member of the cycle, so the counter is self-starting from any state including the natural power-on and synchronous-reset value $0$, and the "guarantee a non-zero seed" clause of the plain LFSR disappears along with the reset-network care it implied. That, not the extra count, is usually why the gate is worth buying: the dead state is not merely avoided, it no longer exists.

**Trace it at $n=4$ with $p(x)=x^4+x+1$.** Taps $T=\{3,0\}$, so $f=s_3\oplus s_0$ and $Z=\overline{s_2\vee s_1\vee s_0}$. Seeded at $0000$, the sixteen states in order are

| $s$ | $0000$ | $0001$ | $0011$ | $0111$ | $1111$ | $1110$ | $1101$ | $1010$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| as int | 0 | 1 | 3 | 7 | 15 | 14 | 13 | 10 |

| $s$ | $0101$ | $1011$ | $0110$ | $1100$ | $1001$ | $0010$ | $0100$ | $1000$ |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| as int | 5 | 11 | 6 | 12 | 9 | 2 | 4 | 8 |

and then back to $0000$. Strip the first entry and this is exactly the fifteen-state m-sequence of [[Fibonacci LFSR]] in the same order — the splice inserts one state and permutes nothing. The two modified edges are the only places the arithmetic differs: at $s=1000$, $f=1\oplus0=1$ but $Z=1$ gives $f'=0$ and $s^{+}=0000$ instead of $0001$; at $s=0000$, $f=0$ but $Z=1$ gives $f'=1$ and $s^{+}=0001$ instead of $0000$.

> [!important] The state *is* the last $n$ output bits, which is where the name comes from.
> The output is the bit shifted out, $s_{n-1}$, and by the shift structure $s_{n-1}(t{+}k)=s_{n-1-k}(t)$, so the window of $n$ consecutive output bits starting at $t$ reconstructs the state at $t$ bit-for-bit. Every state occurring exactly once per period is therefore the same statement as every $n$-bit word occurring exactly once as a cyclic window — a de Bruijn sequence $B(2,n)$. For the trace above the output is $0000111101011001$. The same identity is the security statement in reverse: $n$ observed bits pin the state exactly, so this is a counter and a test-pattern source, never a keystream.

**Pay for it in the clock period, which is where the LFSR's whole advantage lived.** The plain LFSR's selling point is a next-state depth of one XOR *independent of $n$*, so its clock bound $T_{\text{clk}}\ge t_{cq}+t_{\text{XOR2}}+t_{su}$ holds at any width. The detect sits in series with that feedback and is a $(n-1)$-input reduction, so the bound becomes

$$T_{\text{clk}}\ \ge\ t_{cq}+t_{\text{NOR}(n-1)}+t_{\text{XOR2}}+t_{su}$$

and a wide NOR built from $k$-input gates is a tree of depth $\lceil\log_k(n-1)\rceil$. Width-independence is gone; it is replaced by logarithmic growth, which is the same asymptotic class as a [[Prefix Incrementer]] and strictly worse than the LFSR it modifies.

> [!warning] No sourced silicon numbers
> The long-form source has no book behind it, so there are no gate delays, LUT counts or $f_{\max}$ figures here — only depths that follow from the structure. Whether the detect actually lands on the critical path at your width and process is a question for static timing, not for this note.

**On FPGA the detect is free up to a width you can read off the LUT.** A $k$-input LUT ([[FPGAs]]) absorbs the whole reduction in one level as long as $n-1\le k$, so for the usual 6-LUT fabrics a de Bruijn counter up to $n=7$ costs the same one logic level as the LFSR — the taps XOR, the splice XOR and the detect all collapse into a single lookup, because the entire feedback cone has at most 6 inputs. Beyond that the detect becomes $\lceil\log_k(n-1)\rceil$ LUT levels of general routing, and the shift path can no longer live in an `SRL16`/`SRL32` addressable shift register, since the detect needs the intermediate stage outputs that the SRL does not expose. That second effect is usually the larger cost: it converts the cheapest sequencer on the die into $n$ ordinary flops.

**Retime the detect if the width hurts.** $Z$ depends only on state bits, and all but one of them are known a cycle early: $s_i(t)=s_{i-1}(t-1)$ for $i\ge1$, so

$$Z(t)=\underbrace{\overline{\textstyle\bigvee_{i\le n-3}s_i(t-1)}}_{P,\ \text{registered}}\ \wedge\ \overline{s_0(t)}$$

Compute the $(n-2)$-input NOR from the *previous* state, register it as a 1-bit $P$, and the live feedback becomes $f'=f\oplus(P\wedge\overline{s_0})$ — depth XOR2 plus AND2 plus an inverter, constant in $n$ again, at a cost of one flop and an off-critical-path reduction that has a whole clock period to settle. The one condition is that $P$ carry the same enable as the state register, or the identity $s_i(t)=s_{i-1}(t-1)$ fails on the held cycles.

$$\boxed{\ f'=f\oplus\overline{\bigl(s_{n-2}\vee\cdots\vee s_0\bigr)}\quad\Longrightarrow\quad \text{period}=2^n,\ \text{every $n$-bit word once}\ }$$

**When it breaks**

- **The polynomial must be primitive, not merely irreducible.** The construction adds one state to whatever cycle contains $10\ldots0$. If $p$ is non-primitive the state space is several short cycles, the splice joins the zero state to exactly one of them, and the result is a cycle of length $\ell+1$ for some $\ell\mid 2^n-1$ — a perfectly functional counter of the wrong period, which simulates fine on a short run and fails a long one.
- **The period is $2^n$ and nothing else.** There is no cheap shortening: unlike a binary counter you cannot compare-and-clear at $N$, because the state carries no order. A count to arbitrary $N$ wants a [[Modulo-N Counter]], or an equality decode against the state $x^{N}\bmod p(x)$ applied to the seed, precomputed offline.
- **Still non-monotone, so only equality decodes.** The state at step $k$ is a scrambled word, not the integer $k$; magnitude comparison, addition and interpolation are all meaningless on it. Everything [[Fibonacci LFSR]] says about counting to a deadline rather than a quantity applies unchanged.
- **Not CDC-safe.** Consecutive states differ in every tapped position plus the shift, so a sampled word during a transition can be a state that was never occupied. A pointer crossing a clock domain wants [[Gray Counter]], which trades the shift register's speed for a one-bit Hamming guarantee.
- **The advantage is one state, so measure it against the gate.** At $n=32$ the splice buys one count in $4\times10^9$ and costs a 31-input NOR in the feedback. The reason to build it is the elimination of the lock-up state and the exact power-of-two period for address generation, never the extra count itself.
- **Galois form does not make the detect cheaper.** [[Galois LFSR]] moves the taps into the shift path so the *tap* logic is one XOR2 per tap and the feedback is depth 1 regardless of $|T|$, but the zero-detect still reads $n-1$ flop outputs, so the wide reduction survives the transformation intact and becomes proportionally the larger share of the delay.

**RTL (Spade)**

```spade
fn debruijn_next<#uint N>(s: uint<N>, taps: uint<N>) -> uint<N> {
    let sh: uint<N> = s <<. 1;
    let f = (s & taps).as_bits().reduce_xor();
    let z = sh == 0;
    sh | (if f ^^ z { 1 } else { 0 })
}

entity debruijn<#uint N>(clk: clock, rst: bool, en: bool, taps: uint<N>) -> uint<N> {
    reg(clk) s: uint<N> reset(rst: 0) = if en { debruijn_next(s, taps) } else { s };
    s
}
```

`s` is the flop chain of the diagram and `taps` is a compile-time-constant mask standing for $T$, so `s & taps` selects the tapped stages and `reduce_xor` is the left-hand $\oplus$ gate — one $|T|-1$ deep XOR reduction, not one gate per bit. `sh` is the shift *and* the zero-detect at once: `s <<. 1` is the truncating shift, dropping $s_{n-1}$ and forcing bit 0 low, so `sh == 0` is true exactly when $s_{n-2}\ldots s_0$ are all zero — that comparison is the $(n-1)$-input NOR of the drawing, and the shifter itself is pure rewiring that synthesis will not build. All widths are $n$ except `f`, `z` and the spliced bit, which are 1; `^^` is the boolean XOR (`^` is the bitwise one and is not defined on `bool`). Reset goes to $0$, which is legal *because* of the splice and would be a lock-up in the unmodified LFSR. Synthesis will flatten `debruijn_next` into the flop input cone rather than keeping it as a block, and on FPGA will merge the two XORs and the NOR into one LUT for small $n$ as argued above.

**Related Notes**

- [[Fibonacci LFSR]] – extends: the unmodified recurrence, its primitive-polynomial period $2^n-1$, and the all-zeros fixed point this note removes.
- [[Galois LFSR]] – compares: the same sequence with the taps moved into the shift path; the splice transfers, the wide detect does not get cheaper.
- [[Ring Counter]] – compares: the other shift-register counter, trading all density for a free glitch-free decode.
- [[Johnson Counter]] – compares: $2n$ states from $n$ flops with one bit changing per step, where this gives $2^n$ states with no Hamming guarantee.
- [[Modulo-N Counter]] – counter-example: what to build when the period must be something other than a power of two.
- [[Prefix Incrementer]] – compares: the same $O(\log n)$ feedback depth, but on a state you can actually read as a number.
- [[Choosing a Counter]] – compares: where this sits against every sibling counter.

## References

- [[2.8) Counters]] — §LFSR counters: the Fibonacci recurrence and tap set, the primitive-polynomial period, the depth-1 feedback argument, the all-zeros warning naming this construction, and the $n=4$ worked trace for $p(x)=x^4+x+1$ reused above.
- No textbook source for this topic. The material is standard in Wakerly, *Digital Design: Principles and Practices* (LFSRs, primitive polynomials, the "modified" full-period LFSR), Mano & Ciletti, *Digital Design* (shift registers and unused-state analysis), and Weste & Harris, *CMOS VLSI Design* (LFSRs for BIST pattern generation). Page numbers are deliberately omitted — no copy was consulted for this note.
