---
title: Fibonacci LFSR
description: "Shift register with tapped bits gathered into one wide XOR; a primitive polynomial gives period 2^n - 1 for n flops and |T|-1 gates, at the cost of a non-monotone count and a dead all-zeros state."
kind: circuit
source: "2.8) Counters §LFSR counters, §4-bit LFSR p(x)=x^4+x+1, §FPGA mapping — no book source"
status: seed
spade: simulated
tags: [digital, counters, lfsr, shift-register, fpga]
aliases:
  - LFSR
  - LFSRs
  - Linear Feedback Shift Register
  - Fibonacci LFSRs
  - Many-to-One LFSR
  - LFSR Counter
---

# Fibonacci LFSR

A shift register whose head is driven by the XOR of a fixed set of its own bits, so the next-state depth is a single XOR tree of $\lceil\log_2|T|\rceil$ levels no matter how wide the counter is.

```tikz title="4-bit Fibonacci LFSR for p(x) = x^4 + x + 1, taps gathered into one XOR outside the shift path"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % ---- feedback XOR, outside the shift path ----
  \node[xor port, scale=0.85] (X) at (-3.0,0.6) {};

  % ---- four 1-bit stages, shifting left to right ----
  \foreach \i/\lbl in {0/0, 1/1, 2/2, 3/3} {
    \pgfmathsetmacro\x{2.4*\i}
    \draw (\x,0) rectangle (\x+1.6,1.2);
    \node at (\x+0.8,0.72) {$s_{\lbl}$};
    \node at (\x+0.8,0.26) {\tiny $1$};
    \draw (\x+0.14,0.0) -- (\x+0.36,0.18) -- (\x+0.14,0.36);
  }

  % ---- shift path: pure wire, no logic between stages ----
  \draw[->] (X.out) -- (0,0.6);
  \node[anchor=south] at (-1.2,0.66) {$f$ \, / \, $1$};
  \foreach \i in {0,1,2} {
    \pgfmathsetmacro\x{2.4*\i}
    \draw[->] (\x+1.6,0.6) -- (\x+2.4,0.6);
  }
  \draw[->] (8.8,0.6) -- (10.6,0.6);
  \node[anchor=south] at (10.0,0.66) {$s_3$ \, / \, $1$};

  % ---- tap from s_0, routed above the shift path ----
  \fill (2.0,0.6) circle (1.6pt);
  \draw (2.0,0.6) -- (2.0,2.1) -- (-4.4,2.1) -- (-4.4,0.35) -- (X.in 2);
  \node[anchor=south] at (-1.0,2.15) {tap $s_0$ \ (term $x^1$)};

  % ---- tap from s_3, routed above that ----
  \fill (9.2,0.6) circle (1.6pt);
  \draw (9.2,0.6) -- (9.2,3.2) -- (-5.2,3.2) -- (-5.2,0.85) -- (X.in 1);
  \node[anchor=south] at (3.5,3.25) {tap $s_3$ \ (term $x^4$ --- the bit shifted out)};

  % ---- clock rail, below ----
  \draw (-4.4,-1.4) -- (10.0,-1.4);
  \node[anchor=east] at (-4.45,-1.4) {clk};
  \foreach \i in {0,1,2,3} {
    \pgfmathsetmacro\x{2.4*\i}
    \draw[->] (\x+0.25,-1.4) -- (\x+0.25,0.0);
    \fill (\x+0.25,-1.4) circle (1.6pt);
  }

  \node[anchor=west] at (-5.2,4.6) {state $s$ \, / \, $4$ \qquad $s^{+}=(s\ll 1)\ |\ f$, \qquad $f=s_3\oplus s_0$, \qquad $p(x)=x^4+x+1$};
  \node[anchor=west] at (-5.2,4.05) {one XOR2 in total; a $|T|$-tap polynomial costs $|T|-1$ XOR2 of depth $\lceil\log_2|T|\rceil$, independent of $n$};

\end{circuitikz}
\end{document}
```

**Write the update as one shift and one parity bit.** The state $s$ is $n$ bits, $s=(s_{n-1}\ldots s_1s_0)$, and every wire in the drawing above except the feedback net is $1$ bit. The update is

$$s^{+}=(s\ll1)\;|\;f,\qquad f=\bigoplus_{i\in T}s_i$$

with $\ll$ the $n$-bit shift that discards $s_{n-1}$, and $T\subseteq\{0,\ldots,n-1\}$ the **tap set**. Nothing sits between stage $i$ and stage $i+1$ — the shift path is bare wire — so the entire next-state function is the parity $f$ of $|T|$ existing flop outputs. That is the defining structural choice and the reason for the name: *many-to-one*, many bits gathered into one XOR, as against the *one-to-many* [[Galois LFSR]] which pushes the same information out along the shift path.

**Read the tap set off a polynomial over $\mathrm{GF}(2)$.** Take $p(x)=x^n+c_{n-1}x^{n-1}+\cdots+c_1x+c_0$ with $c_j\in\{0,1\}$ and $c_0=1$. The circuit realises the linear recurrence $a_k=\sum_{j=1}^{n}c_{n-j}\,a_{k-j}$ over $\mathrm{GF}(2)$, where $a_k$ is the bit entering the head at step $k$; the register simply holds the last $n$ terms of that sequence, $s_i=a_{k-n+i}$. Matching coefficients, $i\in T$ exactly when the term $x^{\,i+1}$ appears in $p$, plus the leading $x^n$ term which contributes the outgoing bit $s_{n-1}$. So $|T|$ is the number of nonzero coefficients of $p$ below $x^n$, plus one — and $p(x)=x^4+x+1$ gives $T=\{3,0\}$: the $x^4$ term is $s_3$, the $x^1$ term is $s_0$, and the constant $1$ is the recurrence's own left-hand side, not a tap.

**Linearity forces the state space into disjoint cycles.** Because XOR is addition in $\mathrm{GF}(2)$ and the shift is a fixed bit permutation, $s^{+}=Ms$ for the $n\times n$ companion matrix $M$ of $p$ over $\mathrm{GF}(2)$ — no constants, no ANDs, no $\bmod\,2^n$ carries anywhere, which is why none of the rounding or ulp machinery of [[Error Accuracy]] applies and none of the width-growth rules of [[Number Formats]] do either. $\det M=c_0=1$, so $M$ is invertible and the map is a **bijection**; a bijection on a finite set has no transients, so every state lies on a cycle and the state space partitions into disjoint cycles. That is the whole reason an LFSR never falls into a tail — but it is also why a bad seed can strand it on a short cycle forever.

**Primitivity is exactly the condition for one long cycle.** If $p$ is irreducible then $\mathrm{GF}(2)[x]/(p)\cong\mathrm{GF}(2^n)$ is a field, whose multiplicative group is cyclic of order $2^n-1$. Identify a state with the residue class it represents; the shift-and-reduce step *is* multiplication by $x$, so the cycle through a nonzero state has length $\operatorname{ord}(x)$, the multiplicative order of $x$ in that group. By Lagrange, $\operatorname{ord}(x)\mid 2^n-1$, and $p$ is called **primitive** precisely when $\operatorname{ord}(x)=2^n-1$. Then every one of the $2^n-1$ nonzero states sits on a single cycle, visited once each:

- $p$ primitive $\Rightarrow$ period $2^n-1$ from any nonzero seed;
- $p$ irreducible but not primitive $\Rightarrow$ several cycles, each of length $\operatorname{ord}(x)$, a proper divisor of $2^n-1$;
- $p$ reducible $\Rightarrow$ cycles of assorted lengths, and the seed decides which one you get.

Primitive trinomials are tabulated for every useful $n$; you look one up rather than search, and the $2^n-1$ is a **theorem**, not a measurement.

**The next-state depth is the point, and it does not grow with $n$.** From [[Introduction to Flip-Flops & Latches]] the clock constraint is $T_{\text{clk}}\ge t_{cq}+t_{\text{logic}}+t_{su}+t_{\text{skew}}$. Here $t_{\text{logic}}$ is one balanced XOR tree over $|T|$ inputs — $|T|-1$ XOR2 gates arranged $\lceil\log_2|T|\rceil$ deep:

$$T_{\text{clk}}\ \ge\ t_{cq}+\big\lceil\log_2|T|\big\rceil\,t_{\text{XOR2}}+t_{su}+t_{\text{skew}}$$

Choose a trinomial, $|T|=2$, and that is a single XOR2 for a counter of any width — within one gate of the flop's own toggle limit. The contrast with an [[Incrementer]] is total: $n$ AND2 plus $n$ XOR2 and an $O(n)$ carry chain, or $O(\log n)$ for the [[Prefix Incrementer]], versus $|T|-1$ gates and $O(\log|T|)$ depth. The LFSR's cost is independent of the count width because it never computes a sum.

> [!note] The classic "one XOR, any width" claim is the Galois form's, not this one
> $\lceil\log_2|T|\rceil$ is only $1$ when $|T|=2$. A four-tap pentanomial makes this a two-level tree, and the wide XOR also sits on a long wire: the taps come from flops scattered along the register and all converge on the head, so on an ASIC the routing delay of that convergence can exceed the gate delay it was meant to save. The [[Galois LFSR]] has exactly one XOR2 in series for *any* $|T|$, all of them local to adjacent stages. Prefer Fibonacci when you want the shift path to be untouched bare wire; prefer Galois when $|T|>2$ and $f_{\max}$ binds.

**What you give up is the meaning of the count.** State $k$ is the $n$-bit value $x^{k}\cdot s_0$ in $\mathrm{GF}(2^n)$, a scrambled permutation of the integers, not the integer $k$. There is no carry, no order relation, no useful magnitude comparison — so an LFSR is the right counter whenever you need to *count to $N$* but never to *know the count*: timeouts, watchdogs, high-speed prescalers, DRAM refresh counters, memory-test address generation, BIST pattern generation. The terminal state is computed offline once as $x^{N}\bmod p(x)$ applied to the seed and detected with an [[Equality Comparator]] — an $n$-input AND with the zero-bit positions inverted, the same cost as the compare in any [[Modulo-N Counter]], and unlike a magnitude compare it is a single gate level after the AND tree. The count itself is exact, $0$ ulp; it is merely written in a permuted alphabet.

> [!warning] All-zeros is a fixed point, and reset must break it
> $f=\bigoplus_{i\in T}0=0$, so $s=0$ maps to itself: the $2^n$-th state is a cycle of length one and the counter dies silently, with no flag and no glitch to notice. This is the $M$-is-a-bijection argument biting — zero is a legitimate cycle, just a useless one. Either guarantee a nonzero seed on reset (the usual fix; reset the register to $1$, not to $0$, which is the opposite of every other counter in this folder) or splice the missing state in with a [[De Bruijn Counter]].

**On FPGA the flops disappear entirely.** A LUT on a modern fabric can be configured as a 16- or 32-deep addressable shift register — Xilinx `SRL16`/`SRL32` ([[Lookup-Tables]], [[FPGAs]]) — so the shift path of an LFSR up to that depth costs *one LUT and no flops*, with a second LUT for the feedback XOR. That is the cheapest sequencer on the die, and it runs at the fabric's maximum toggle rate. The catch is specific to the Fibonacci form: an SRL exposes only its final stage plus **one** addressable interior tap, so a trinomial ($|T|=2$) maps perfectly and anything wider forces the interior taps back out into real flops. This is a second, independent reason to pick a trinomial, and it does not apply to the [[Galois LFSR]], whose taps must interrupt the shift path and therefore cannot hide in an SRL at all. On an ASIC there is no such structure: $n$ flops are $n$ flops, and the only saving over a binary counter is the missing carry chain.

**Trace four bits and the period is visible.** With $p(x)=x^4+x+1$, so $T=\{3,0\}$, $f=s_3\oplus s_0$ and $s^{+}=(s_2s_1s_0f)$, seeded at $1000$:

| step | $s$ | $s_3\oplus s_0$ | step | $s$ | $s_3\oplus s_0$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $1000$ | $1\oplus0=1$ | 8 | $0101$ | $0\oplus1=1$ |
| 1 | $0001$ | $0\oplus1=1$ | 9 | $1011$ | $1\oplus1=0$ |
| 2 | $0011$ | $0\oplus1=1$ | 10 | $0110$ | $0\oplus0=0$ |
| 3 | $0111$ | $0\oplus1=1$ | 11 | $1100$ | $1\oplus0=1$ |
| 4 | $1111$ | $1\oplus1=0$ | 12 | $1001$ | $1\oplus1=0$ |
| 5 | $1110$ | $1\oplus0=1$ | 13 | $0010$ | $0\oplus0=0$ |
| 6 | $1101$ | $1\oplus1=0$ | 14 | $0100$ | $0\oplus0=0$ |
| 7 | $1010$ | $1\oplus0=1$ | 15 | $1000$ | — wraps |

Fifteen distinct states which, sorted, are exactly $0001$ through $1111$ — the period is $2^4-1=15$ and $0000$ is excluded, as the theory demands. As integers the sequence is $8,1,3,7,15,14,13,10,5,11,6,12,9,2,4$: plainly non-monotone, and to "count ten cycles" you compare against $s=0110$ from step 10, never against a numeral.

$$\boxed{\ s^{+}=(s\ll1)\;\big|\;\bigoplus_{i\in T}s_i,\qquad \text{period}=2^n-1\ \Longleftrightarrow\ p\ \text{primitive},\qquad t_{\text{logic}}=\lceil\log_2|T|\rceil\,t_{\text{XOR2}}\ }$$

**When it breaks**

- **A non-primitive polynomial silently shortens the period.** Nothing in the hardware checks; the circuit runs, the sequence looks random, and a watchdog wired to a divisor-length cycle expires early forever. Verify $\operatorname{ord}(x)=2^n-1$ offline, or take a tabulated primitive trinomial.
- **The seed must be nonzero and the reset value is $1$, not $0$.** A global reset that clears registers to zero kills this one. So does a single-event upset that happens to land on all-zeros, from which there is no recovery without a detect.
- **The output is not random.** The sequence is maximal-length, which is a strong statistical property and a **worthless** cryptographic one: $2n$ consecutive output bits determine $p$ and the whole future by the Berlekamp–Massey algorithm, because the generator is linear by construction — the same linearity the period proof rests on.
- **Wide XOR fan-in and long tap routing.** Beyond $|T|=2$ the $\lceil\log_2|T|\rceil$ tree and the wires converging on the head start to matter; the [[Galois LFSR]] keeps depth at one XOR2 and all wiring local, at the price of a shift path that is no longer bare wire.
- **Decoding more than one state is expensive.** Each terminal value needs its own $n$-input comparator, since there is no ordering to exploit. Two or three deadlines are fine; a dozen means you wanted a real count and should have used a [[Synchronous Counters|synchronous counter]] or a [[Zero-Detect Down Counter]].
- **Half the flops toggle per cycle on average**, which is more switching activity per flop than a binary counter's $\approx2$ toggles per cycle in total. For pure clock division, where only the top bit is consumed, a ripple chain ([[Asynchronous Counters]]) is dramatically cheaper in power.

**RTL (Spade)**

```spade
entity lfsr_fib<#uint N>(clk: clock, rst: bool, seed: uint<N>, taps: uint<N>) -> uint<N> {
    reg(clk) s reset(rst: seed) = {
        let f = (s & taps).as_bits().reduce_xor();
        (s << 1) | zext(f.as_uint())
    };
    s
}
```

`taps` is the tap set $T$ as a bitmask — bit $i$ set means $s_i\in T$ — so `s & taps` masks off the untapped bits and `reduce_xor` is the $\lceil\log_2|T|\rceil$-deep XOR tree of the drawing, producing the $1$-bit `f`. `s << 1` is the bare shift path, $N$ bits in and $N$ out with $s_{N-1}$ discarded, and the `| zext(f.as_uint())` drops `f` into the vacated bit $0$; the shift and the OR are pure wiring, so the only gates in the whole entity are the mask AND and the XOR tree. The reset value is the port `seed` rather than a literal, because resetting to `0` would lock the register at the fixed point — the one place where this counter's reset is not `0`. Synthesis will do two things the drawing does not: constant-propagate `taps` away entirely when it is tied off, leaving only the $|T|-1$ XOR2 gates, and on FPGA collapse the shift path into an `SRL` so that most of the $N$ flops in the picture never exist as flops.

**Related Notes**

- [[Galois LFSR]] – compares: the same polynomial with the XOR moved into the shift path — one XOR2 of depth for any $|T|$, different state permutation, no SRL mapping.
- [[De Bruijn Counter]] – extends: XNORs an all-zeros detect into $f$ to splice the dead state back in and reach the full period $2^n$.
- [[Equality Comparator]] – depends-on: the only usable decode of a non-monotone count, matching the precomputed terminal state $x^N\bmod p(x)$.
- [[Lookup-Tables]] – supports: the `SRL16`/`SRL32` mode that makes the shift path cost one LUT and no flops.
- [[Incrementer]] – counter-example: the sibling whose next-state logic is $O(n)$ deep precisely because it computes a magnitude this one refuses to.
- [[Synchronous Counters]] – compares: the monotone counter you fall back to the moment the count has to mean a number.
- [[Modulo-N Counter]] – compares: the same "reach $N$ then act" job with an ordered state and a magnitude compare.
- [[Two-Stage Prescaled Counter]] – compares: the other way to buy $f_{\max}$ at large $n$, by splitting the carry chain rather than deleting it.
- [[Ring Counter]] – compares: the other feedback-shift-register counter, $N$ flops for $N$ states but a free glitch-free decode.
- [[Choosing a Counter]] – compares: where "the count is a deadline, not a quantity" sits against every sibling.

## References

- [[2.8) Counters]] — §LFSR counters (the update rule, the tap-set-from-polynomial reading, the depth argument, the all-zeros fixed point), §Worked example, 4-bit LFSR $p(x)=x^4+x+1$ (the 15-state trace), §FPGA mapping (`SRL16`/`SRL32`), §Trade-offs (the comparison row).
- No textbook source for this topic. Standard in Wakerly, *Digital Design: Principles and Practices* — shift registers, LFSR counters, primitive polynomials and maximal-length sequences; Mano & Ciletti, *Digital Design* — registers and shift registers, unused-state analysis; Weste & Harris, *CMOS VLSI Design* — LFSRs as BIST pattern generators and signature analysers. Page numbers are omitted deliberately; no copy was consulted while writing.
