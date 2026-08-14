---
title: Gray Counter
description: "Binary core with a registered Gray conversion beside it — exactly one bit in flight per step, so a sampled word is always either the old or the new count; the only cheap way to be correct across a clock domain."
kind: circuit
source: "2.8) Counters §Gray counters, §Trade-offs — no book source"
status: seed
spade: verified
tags: [digital, counters, gray, cdc, fifo]
aliases:
  - Gray Code Counter
  - Gray-Code Counter
  - Gray Counters
---

# Gray Counter

A binary counter whose state is published in Gray code, so that consecutive counts differ in exactly one bit and any sample taken during a transition is a legal count rather than an arbitrary mixture.

```tikz title="Gray counter: binary core, registered shift-XOR conversion, Gray word crossing the domain boundary"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=latex]

  % --- binary core, top row (y = 1.6) ---
  \draw (0,1.0) rectangle (1.8,2.2);
  \node at (0.9,1.6) {$b$ reg};
  \draw (3.2,1.0) rectangle (4.8,2.2);
  \node at (4.0,1.6) {$+1$};

  \draw[->] (1.8,1.6) -- (3.2,1.6);
  \node[above] at (2.95,1.65) {$n$};

  \draw (4.8,1.6) -- (6.8,1.6);
  \fill (5.6,1.6) circle (1.6pt);

  % feedback b+ -> b reg
  \draw[->] (6.8,1.6) -- (6.8,3.1) -- (-1.1,3.1) -- (-1.1,1.6) -- (0,1.6);
  \node[above] at (2.85,3.1) {$b^{+}=b+1 \bmod 2^{n}$ \quad ($n$ bits)};

  % binary count also leaves the block
  \fill (2.5,1.6) circle (1.6pt);
  \draw[->] (2.5,1.6) -- (2.5,0.6);
  \node[below] at (2.5,0.55) {RAM address};

  % --- gray conversion, bottom row (y = -0.6) ---
  \draw[->] (5.6,1.6) -- (5.6,0.0);
  \draw (4.4,-1.2) rectangle (6.8,0.0);
  \node at (5.6,-0.6) {$x \oplus (x \gg 1)$};

  \draw[->] (6.8,-0.6) -- (7.8,-0.6);
  \node[above] at (7.3,-0.55) {$n$};

  \draw (7.8,-1.2) rectangle (9.4,0.0);
  \node at (8.6,-0.6) {$g$ reg};

  \draw[->] (9.4,-0.6) -- (13.6,-0.6);
  \node[above] at (11.0,-0.55) {$g$ \; ($n$ bits)};
  \node[below] at (11.0,-0.75) {one bit in flight};

  % domain boundary
  \draw[dashed] (12.6,-1.9) -- (12.6,1.1);
  \node[above] at (12.6,1.1) {domain boundary};

  % --- clock ---
  \draw (-1.1,-2.6) -- (9.4,-2.6);
  \node[left] at (-1.15,-2.6) {clk};
  \draw[->] (0.9,-2.6) -- (0.9,1.0);
  \draw[->] (8.6,-2.6) -- (8.6,-1.2);
  \fill (0.9,-2.6) circle (1.6pt);
  \fill (8.6,-2.6) circle (1.6pt);

\end{circuitikz}
\end{document}
```

**Fix the code before the counter.** The Gray encoding of an $n$-bit unsigned $b$ (bit weights as in [[Number Formats]]) is the $n$-bit word

$$g = b \oplus (b \gg 1), \qquad\text{i.e.}\qquad g_i = b_i \oplus b_{i+1},\quad b_n \equiv 0$$

so $g_{n-1}=b_{n-1}$ and the map costs $n-1$ two-input XORs of depth 1. It is a bijection on $\{0,1\}^n$ because it is invertible by the suffix XOR $b_i=\bigoplus_{j\ge i} g_j$ — substitute and the sum telescopes, every $b_j$ with $j>i$ appearing twice and cancelling by $x\oplus x=0$. Both directions live in [[Gray Code Converter]]; nothing below re-derives them.

**One increment moves exactly one bit — the whole reason the circuit exists.** Write $b$ with its trailing run of ones exposed, $b=\ldots x\,0\,1^{k}$, so that by the ripple-carry rule $b+1=\ldots x\,1\,0^{k}$: the run inverts and the carry stops at the first zero. Evaluate $g_i=b_i\oplus b_{i+1}$ on both words:

| $i$ | $g_i(b)$ | $g_i(b+1)$ |
| --- | --- | --- |
| $i<k-1$ | $1\oplus1=0$ | $0\oplus0=0$ |
| $i=k-1$ | $1\oplus0=1$ | $0\oplus1=1$ |
| $i=k$ | $0\oplus x=x$ | $1\oplus x=\bar{x}$ |
| $i>k$ | unchanged | unchanged |

Only position $k$ differs, so $d_H(g(b),g(b+1))=1$ for every $b$, and by bijectivity the $2^n$ codewords form a Hamiltonian cycle on the hypercube. $\square$ Note that the number of *binary* bits that flip is $k+1$ and grows without bound; it is the encoding, not the increment, that is doing the work.

**Turn the single-bit property into a metastability argument.** A receiving flop whose setup/hold window is violated resolves to *either* value after some resolution time ([[Introduction to Flip-Flops & Latches]]), and each bit of a bus resolves independently — there is no shared arbiter across a $n$-bit word. If $m$ bits change at the same source edge, the destination can latch any of the $2^m$ mixtures of old and new bits. A binary pointer crossing $0111 \to 1000$ can therefore be sampled as $1111$ or $0000$: values that are not merely stale but were never counts at all. With $m=1$ the mixture set has two elements, and both of them are counts.

> [!important] The error is bounded at one count, and always in the safe direction.
> A sampled Gray pointer is either the old count or the new one, so a FIFO's flags are *conservative*: a stale read pointer makes the write side see fewer free entries and assert `full` early; a stale write pointer makes the read side see fewer valid entries and assert `empty` early. Never the unsafe direction. That bound, not the encoding's elegance, is what buys the extra register.

**Register the conversion; do not convert the registered value.** Keep the binary state and compute the Gray word from the *next* binary value, so both registers update on the same edge from the same combinational cone:

$$b^{+}=b+1 \bmod 2^{n}, \qquad g^{+}=b^{+}\oplus(b^{+}\gg1)$$

The alternative — one binary register followed by a combinational $b\oplus(b\gg1)$ driving the domain boundary — is *functionally* identical and *electrically* wrong: the binary register's bits arrive with clock-to-Q skew between them, and an XOR of two skewed edges emits a hazard pulse. A receiver sampling that pulse sees a word that is neither the old nor the new count and the whole argument above collapses. Registering $g$ resynchronises every bit to one edge; the only remaining spread is the Gray register's own $\Delta t_{cq}$, which is a single flop's variation and does not create false codewords because only one flop is moving.

**Count the cost, and note where it lands in the timing path.** Signals: $b$ is $n$ bits, $g$ is $n$ bits, `en` and `rst` are 1 bit each. Flops: $2n$, against $n$ for a plain [[Synchronous Counters|synchronous counter]] — the price of the whole scheme. Logic: the increment, plus $n-1$ XOR2. Critical path: the XOR sits between the incrementer output and the *Gray* register's D input, so it lengthens the setup path of that register only and adds nothing to the increment recurrence $b \to b^{+} \to b$. If the binary loop was the critical path before, it still is; if the loop had slack of at least $t_{\text{XOR}}$, the Gray register is free in $f_{\max}$ terms.

**On FPGA the conversion is one LUT level, not a second carry chain.** Substituting the incrementer's own recurrence $b_i^{+}=b_i\oplus c_i$ with $c_{i+1}=c_i \wedge b_i$ (from [[Incrementer]]) into $g_i^{+}=b_i^{+}\oplus b_{i+1}^{+}$ gives

$$g_i^{+} = b_i \oplus b_{i+1} \oplus c_i \oplus (c_i \wedge b_i)$$

a function of three variables $(b_i,\,b_{i+1},\,c_i)$ only. Three inputs fit one 6-LUT with room to spare, fed by the carry-chain node $c_i$ the fabric already exposes, so the Gray path is one LUT plus routing into a flop that is sitting unused in the slice anyway ([[Lookup-Tables]], [[FPGAs]]). On ASIC the same expression is one XOR3 plus a shared AND, and the synthesiser will usually just build the $n-1$ XOR2s off the incrementer's sum bits — no reason to force the substitution. Either way the binary count stays available for arithmetic and, in the async-FIFO structure this counter was invented for, addresses the RAM directly ([[Block Memory]]).

$$\boxed{\ g^{+} = b^{+}\oplus(b^{+}\gg1),\quad b^{+}=b+1 \bmod 2^{n}
\quad\Longrightarrow\quad d_H(g^{+},g)=1\ }$$

**When it breaks**

- **Odd moduli do not exist.** Each step flips one bit, so codeword parity alternates; a closed cycle of length $N$ needs $N$ even. There is no cyclic Gray code of odd length, and the full-cycle construction above needs $N=2^n$. A non-power-of-two FIFO depth is handled by sizing the pointer to the next power of two and bounding occupancy elsewhere, never by truncating the Gray sequence.
- **Only unit steps are protected.** Loading a value, counting by $2$, or skipping counts flips several Gray bits at once and forfeits the entire guarantee. A gated enable is fine — no change at all is not a change. Down-counting is fine too, since $\pm1$ is still one hypercube edge.
- **Gray words do not add or compare.** Only equality is meaningful directly; magnitude comparison, subtraction, and the FIFO's fill level require converting back, or the two-MSB trick specific to power-of-two pointers. Every consumer that needs a *quantity* rather than a *marker* pays for a suffix-XOR converter of depth $\lceil\log_2 n\rceil$ with a prefix network.
- **Bounded corruption is not bounded latency.** The guarantee is that the sampled value is old-or-new; it says nothing about *how* old. If the source counts faster than the destination samples, the destination misses counts entirely and stays legal while being arbitrarily wrong. Gray coding replaces a correctness problem with a rate constraint — it does not remove the need for a synchroniser stage, and it does not substitute for a handshake when every update must be seen.
- **A [[Johnson Counter]] takes over at small state counts.** It is also a Gray code, needs no incrementer or conversion at all, and runs at the flop toggle limit — but gives only $2n$ states from $n$ flops. Above a handful of states the density argument flips back to this circuit.

**RTL (Spade)**

```spade
entity gray_counter<#uint N>(clk: clock, rst: bool, en: bool) -> (uint<N>, uint<N>) {
    decl b_next;
    reg(clk) b: uint<N> reset(rst: 0) = b_next;
    let b_next: uint<N> = if en { trunc(b + 1) } else { b };

    reg(clk) g: uint<N> reset(rst: 0) = b_next ^ (b_next >> 1);
    (b, g)
}
```

`b` is the binary register of the diagram and `b_next` is the wire labelled $b^{+}$; `decl` is needed because the register is written before the incrementer that feeds it. `b + 1` is `uint<{N+1}>`, so `trunc` performs the $\bmod\,2^n$ wrap explicitly — the wrap is the design intent, not an overflow. `b_next ^ (b_next >> 1)` is combinational and sits *inside* the second `reg`, which is exactly the "register the conversion" choice: the Gray value is never a combinational output. Both registers reset to $0$ consistently, since $g(0)=0$. Synthesis will not build a shifter for `>> 1` — a constant shift is pure rewiring — and on FPGA it will fold the XOR into the LUTs in front of the `g` flops as derived above. The stdlib's `to_gray()` method computes the same word; the explicit form is kept here because the shift-XOR *is* the note.

**Related Notes**

- [[Gray Code Converter]] – depends-on: the $b\to g$ and $g\to b$ maps and their depths, used here as a black box.
- [[Incrementer]] – depends-on: the binary core, and the carry recurrence the FPGA substitution above rests on.
- [[Synchronous Counters]] – compares: the same counter without the second register, and without the CDC guarantee.
- [[Johnson Counter]] – compares: a Gray code obtained from a shift register instead of an incrementer, $2n$ states from $n$ flops.
- [[Block Memory]] – extends: the async FIFO where the binary count addresses the RAM and the Gray count crosses.
- [[Introduction to Flip-Flops & Latches]] – supports: independent per-bit metastability resolution, which is the premise of the whole argument.
- [[Choosing a Counter]] – compares: where this sits against every sibling counter.

## References

- [[2.8) Counters]] — §Gray counters (encoding, one-bit proof, CDC argument, implementation) and §Trade-offs (the Gray row: $2n$ flops, increment $+1$ XOR, CDC safe).
- No textbook source for this topic. The material is standard in Mano & Ciletti, *Digital Design* (Gray code and code converters), Wakerly, *Digital Design: Principles and Practices* (counters), and Weste & Harris, *CMOS VLSI Design* (synchronisers and metastability). Page numbers are deliberately omitted — no copy was consulted for this note.
