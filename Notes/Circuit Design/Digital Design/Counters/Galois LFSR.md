---
title: Galois LFSR
description: "Same sequence, taps XORed into the shift path instead of gathered: next-state depth is one XOR2 for any width, so T_clk is within a gate of the flop's own toggle limit."
kind: circuit
source: "2.8) Counters §LFSR counters, §Trade-offs — no book source"
status: seed
spade: simulated
tags: [digital, counters, lfsr, prng, bist, crc]
aliases:
  - Galois LFSR
  - Galois-form LFSR
  - Galois LFSRs
  - Modular LFSR
  - One-to-Many LFSR
  - Internal-XOR LFSR
---

# Galois LFSR

A linear-feedback shift register that distributes the feedback XOR into the shift path — one XOR2 in front of each tapped flop rather than one wide XOR tree in front of one flop — so the next-state depth is exactly one gate regardless of width or tap count.

```tikz title="4-bit Galois LFSR for p(x) = x^4 + x + 1: feedback bit XORed into the shift path at tap position 1"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]
  \foreach \i in {0,1,2,3} {
    \pgfmathsetmacro\x{2.6*\i}
    \draw (\x,0) rectangle (\x+1.4,1.2);
    \node at (\x+0.7,0.6) {$s_{\i}$};
  }

  \draw (2.0,0.6) circle (0.3);  \node at (2.0,0.6) {$\oplus$};

  \draw[->] (1.4,0.6) -- (1.7,0.6);
  \draw[->] (2.3,0.6) -- (2.6,0.6);
  \draw[->] (4.0,0.6) -- (5.2,0.6);
  \draw[->] (6.6,0.6) -- (7.8,0.6);

  \node[above] at (4.6,0.6) {$1$};
  \node[above] at (7.2,0.6) {$1$};

  \draw[->] (9.2,0.6) -- (10.0,0.6);
  \node[right] at (10.05,0.6) {out \, / \, $1$};

  \fill (9.6,0.6) circle (1.4pt);
  \draw (9.6,0.6) -- (9.6,-1.3) -- (-1.2,-1.3) -- (-1.2,0.6) -- (0,0.6);
  \draw[->] (-0.3,0.6) -- (0,0.6);

  \fill (2.0,-1.3) circle (1.4pt);
  \draw[->] (2.0,-1.3) -- (2.0,0.3);

  \node[above] at (6.0,-1.3) {$s_3$ \, / \, $1$ \; (feedback, $p_0=1$)};
  \node[right] at (2.1,-0.45) {$p_1=1$};
  \node[anchor=west] at (-1.15,1.6) {state $s$ \, / \, $n=4$ bits \quad $p(x)=x^4+x+1$};
\end{circuitikz}
\end{document}
```

**Read the state as a polynomial and the clock edge as multiplication by $x$.** Take the $n$-bit state $s$ to be the coefficient vector of
$$s(x)=\sum_{i=0}^{n-1}s_i\,x^{i}\ \in\ \mathrm{GF}(2)[x]/\langle p(x)\rangle,\qquad
p(x)=x^{n}+\sum_{i=0}^{n-1}p_i\,x^{i}$$
with $p$ primitive of degree $n$. The register is $n$ bits wide, the coefficient mask $p_{n-1}\dots p_0$ is $n$ bits wide (the $x^n$ term is implicit — it is the register's own width), and every wire in the diagram is $1$ bit. Define the update to be $s^{+}(x)=x\cdot s(x)$ in that quotient ring. Because $p$ is primitive, $x$ is a generator of the multiplicative group of $\mathrm{GF}(2^n)$, whose order is $2^n-1$; the orbit of any non-zero $s$ under repeated multiplication is therefore every non-zero element exactly once, giving period $2^n-1$. That is the same period the Fibonacci form gets, and it is obtained here without ever writing a shift-and-tap recurrence.

**Reduce modulo $p$ and the taps fall into the shift path.** Expand the multiplication before reducing:
$$x\cdot s(x)=\sum_{i=0}^{n-1}s_i x^{i+1}=s_{n-1}x^{n}+\sum_{i=1}^{n-1}s_{i-1}x^{i}$$
The second term is a plain left shift. The first term has degree $n$ and must be reduced. Over $\mathrm{GF}(2)$ addition is its own inverse, so $p(x)=0$ rearranges to
$$x^{n}\equiv\sum_{i=0}^{n-1}p_i\,x^{i}\pmod{p(x)}$$
Substituting and collecting the coefficient of $x^i$ — legal because polynomial addition is coefficientwise, and coefficientwise addition in $\mathrm{GF}(2)$ *is* XOR:
$$s_i^{+}=s_{i-1}\oplus(p_i\wedge s_{n-1})\quad(1\le i\le n-1),\qquad s_0^{+}=p_0\wedge s_{n-1}=s_{n-1}$$
The last simplification uses $p_0=1$, which holds for every primitive polynomial: if $p_0=0$ then $x\mid p(x)$ and $p$ is reducible. So the bit leaving the top of the register re-enters the bottom unconditionally, and is *additionally* XORed into position $i$ wherever $p_i=1$.

**There are no AND gates, because $p_i$ is a constant.** Each $p_i$ is fixed at design time, so $p_i\wedge s_{n-1}$ is either the constant $0$ — the flop's D input is just $s_{i-1}$, a bare wire — or $s_{n-1}$ itself, another bare wire. The AND in the algebra is a routing decision in silicon. What survives is one XOR2 per position with $p_i=1$ and $i\ge1$; writing $w=|\{i<n:p_i=1\}|$ for the tap weight, the whole feedback network is $w-1$ XOR2 gates, which is *exactly* the gate count of the [[Fibonacci LFSR]]'s $w$-input XOR tree. The two forms cost the same area.

**What differs is depth, and depth is what a counter is bought for.** Fibonacci gathers $w$ taps into one XOR before a single flop, so its next-state delay is $\lceil\log_2 w\rceil$ XOR2 levels; Galois puts one XOR2 in each of $w-1$ independent D paths, so its delay is one level whatever $w$ is:
$$T_{\text{clk}}\ \ge\ t_{cq}+t_{\text{XOR2}}+t_{su}$$
independent of both $n$ and $w$. Against the synchronous carry-chain counter of [[Synchronous Counters]], whose depth is $O(n)$ (or $\lceil\log_2 n\rceil$ in the [[Prefix Incrementer]] form), this is the fastest counting structure that still visits $2^n-1$ states with $n$ flops. The one quantity that does grow with $w$ is the **fanout of $s_{n-1}$**, which drives $w$ destinations; past a handful of taps that fanout buffer, not the XOR, sets the delay, and on an ASIC it is what a synthesis tool will actually report.

**Swan's theorem is why the depth advantage is not academic.** If a primitive *trinomial* ($w=2$) existed at every width you would pick one, Fibonacci's tree would collapse to a single XOR2 as well, and the two forms would be indistinguishable. It does not: Swan's theorem says every trinomial of degree $n\equiv0\pmod 8$ over $\mathrm{GF}(2)$ factors, so no irreducible — hence no primitive — trinomial exists at $n=16,32,64$, precisely the widths hardware is built at. At those widths the cheapest primitive polynomial is a pentanomial, $w=4$, Fibonacci needs two XOR2 levels and Galois still needs one. The 16-bit example below, $p(x)=x^{16}+x^{14}+x^{13}+x^{11}+1$, is such a pentanomial.

> [!important] The two forms share a sequence, not a state
> Galois and Fibonacci built on the same $p$ have state-transition matrices that are transposes of each other. A matrix and its transpose have the same characteristic polynomial, so both have order $2^n-1$ and both emit the same $m$-sequence at their output pin, up to a phase offset. But the state *vectors* are related by a fixed invertible linear map, not by equality: at cycle $k$ the two registers hold different words. Fibonacci's state is a window of $n$ consecutive output symbols, which is what a correlator, a Gold-code generator or a phase-shift network needs; Galois's state is a polynomial remainder, which is what a CRC needs. Swapping one for the other because "they have the same taps" silently breaks any consumer that reads the state rather than the pin.

> [!warning] All-zeros is still a fixed point
> $x\cdot 0=0$, so the zero state maps to itself and the counter dies silently — the topology change does not fix this, because the defect is in the algebra, not the wiring. Guarantee a non-zero seed on reset, or splice the missing state into the cycle with a [[De Bruijn Counter]] modification for the full $2^n$ period.

**On FPGA the shift path is broken, and that costs you the SRL trick.** [[Lookup-Tables]] can be reconfigured as addressable shift registers (`SRL16`/`SRL32`), and a Fibonacci LFSR exploits this beautifully: its shift path is an unbroken $n$-deep delay line, so the whole register collapses into a couple of LUTs regardless of $n$. Galois cannot do that — an XOR sits between tapped stages, so only the untapped *runs* between taps can be packed into SRLs, and every tapped position needs a real slice flop. In exchange, each of those flops absorbs its XOR2 into the LUT already sitting in front of it, so the logic itself is free and the untapped flops route directly flop-to-flop with no LUT at all. The rule of thumb inverts by goal: for a **long, cheap** pseudo-random source on [[FPGAs]], Fibonacci plus SRL wins on area; for a **fast** one at a fabric's maximum toggle rate with a dense polynomial, Galois wins on $f_{\max}$.

$$\boxed{\ s_i^{+}=s_{i-1}\oplus(p_i\wedge s_{n-1})\ \ (i\ge1),\qquad s_0^{+}=s_{n-1},\qquad p_0=1\ }$$

Equivalently, in one line of datapath: $s^{+}=(s\ll1)\ \oplus\ (s_{n-1}\ ?\ p:0)$, with the shift truncating at $n$ bits.

**When it breaks.**

- **You need the count, not a deadline.** State $k$ is a scrambled word, not the integer $k$; there is no cheap comparator for "$\ge N$". Precompute the terminal state offline as $x^{N}\!\bmod p(x)$ applied to the seed and detect it with one equality comparator. If you need magnitude or ordering, go back to [[Synchronous Counters]] or, across a domain boundary, [[Gray Counter]] — an LFSR changes many bits per step and is never CDC-safe.
- **The polynomial is a trinomial.** At $w=2$ Fibonacci is also one XOR2 deep and can additionally use SRLs; Galois buys nothing and loses area.
- **The polynomial is very dense.** Beyond roughly eight taps, fanout of $s_{n-1}$ dominates $t_{\text{XOR2}}$ and the "one gate" claim becomes "one gate plus a buffer tree". The depth is still $O(1)$ in $n$; it is no longer literally one gate.
- **You need $2^n$ states.** LFSRs give $2^n-1$; the missing state costs an $(n-1)$-input NOR in the feedback ([[De Bruijn Counter]]).
- **You are reading the state for its sequence structure.** See the callout — Galois's state is not a window of the output sequence.
- **Cryptographic use.** A bare LFSR of any form is linear: $2n$ output bits determine the polynomial and the state by Berlekamp-Massey. It is a counter and a test-pattern source, never a keystream.

> [!warning] Primitivity is not sourced here
> Swan's theorem and tables of primitive polynomials are outside both the long-form note and the digital-design canon this vault cites — they belong to finite-field theory (Golomb, *Shift Register Sequences*) or to vendor application notes. The one polynomial used below, $x^{16}+x^{14}+x^{13}+x^{11}+1$, was confirmed primitive here by exhaustive simulation (period exactly $65535$, all non-zero states visited once), not taken on trust. Any other polynomial you adopt needs the same check.

**RTL (Spade).**

```spade
fn galois_next<#uint N>(s: uint<N>, poly: uint<N>) -> uint<N> {
    (s << 1) ^ if s.msb() { poly } else { 0 }
}

entity galois_lfsr<#uint N>(
    clk: clock, rst: bool, en: bool, poly: uint<N>, seed: uint<N>
) -> uint<N> {
    reg(clk) s reset(rst: seed) = if en { galois_next(s, poly) } else { s };
    s
}

// p(x) = x^16 + x^14 + x^13 + x^11 + 1  ->  coefficient mask 0x6801
entity galois16(clk: clock, rst: bool, en: bool) -> uint<16> {
    inst galois_lfsr::<16>(clk, rst, en, 0x6801, 1)
}
```

`s` is the register row of the diagram, LSB-first, so `s.msb()` is the feedback wire $s_{n-1}$ leaving the rightmost flop and `poly` is the coefficient mask $p_{n-1}\dots p_0$; `s << 1` is the flop-to-flop shift and the `^` is the entire tap network at once. Widths do not grow: `<<` returns $N$ bits by definition and `^` is bitwise, so nothing needs `trunc` — the only place the width could have leaked is the multiplication that never happens, because reduction mod $p$ was folded into the mask. `galois_next` is pure combinational logic in the D path; the single `reg(clk)` is the whole state, and `en` gates it rather than gating the clock. Synthesis will do one thing the drawing cannot show: `poly` is a constant at this call site, so every `^` against a zero coefficient disappears and the surviving XOR2 gates merge into the LUT or the flop's D-input cell — the mask exists as real gates only if you actually drive it at runtime for a programmable scrambler.

Simulated with `.zettel/sim.sh`: five hand-computed asymmetric vectors on the combinational next-state entity (including $\texttt{0x0080}\to\texttt{0x0100}$, which fails under bit reversal, and $\texttt{0x8000}\to\texttt{0x6801}$, which exercises the reduction), 3000 random states against a behavioural reference, and a full-period run of the sequential entity confirming $65535$ distinct non-zero states before the seed recurs.

**Related Notes.**

- [[Fibonacci LFSR]] – compares: same polynomial, same period, same gate count, $\lceil\log_2 w\rceil$ depth instead of $1$ — and an unbroken shift path that Galois gives up.
- [[De Bruijn Counter]] – extends: patches the missing all-zero state into the cycle for a full $2^n$ period.
- [[Lookup-Tables]] – counter-example: the SRL shift-register mode that makes Fibonacci nearly free is unavailable here, because the taps cut the shift path.
- [[Synchronous Counters]] – compares: the monotone alternative whose depth grows with $n$ and whose state you can actually read as a number.
- [[Choosing a Counter]] – compares: where this sits against every sibling structure.
- [[Counters]] – depends-on: the $f_{\max}$-versus-decodability framing the whole topic is organised around.

## References

- `2.8) Counters` §LFSR counters, §Trade-offs — period, tap-set/primitive-polynomial framing, the $t_{cq}+t_{\text{XOR2}}+t_{su}$ bound, the all-zeros lock-up, and the FPGA shift-register mapping.
- No book source. Standard canon for LFSR structure: Wakerly, *Digital Design*, §8.5 (feedback counters); Weste & Harris, *CMOS VLSI Design*, §11 (BIST, MISR and signature analysis); Mano & Ciletti, *Digital Design*, ch. 6 (shift registers).
- The polynomial, the period, and the next-state table were verified by simulation in this note, not cited.
