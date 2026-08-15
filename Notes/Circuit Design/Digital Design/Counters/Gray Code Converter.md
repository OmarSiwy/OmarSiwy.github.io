---
title: Gray Code Converter
description: "Binary to Gray is one row of XOR2 (g = b XOR b>>1); Gray to binary is a suffix-XOR, i.e. a prefix tree of depth log n — cheap one way, a tree the other."
kind: circuit
status: seed
spade: simulated
tags: [digital, counters]
aliases:
  - Gray Code
---

# Gray Code Converter

A pair of purely combinational XOR networks mapping binary to reflected Gray and back, notable for being wildly asymmetric: forward is one gate level, backward is a prefix tree.

```tikz title="Binary-to-Gray XOR row and the Gray-to-binary doubling tree"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}

% ================= left: binary -> Gray, one XOR level =================
\node[anchor=west] at (-0.6,4.5) {\footnotesize\textbf{binary $\to$ Gray}};
\node[anchor=west] at (-0.6,4.0) {\footnotesize $g = b \oplus (b \gg 1)$};

\foreach \i/\y in {3/3.2, 2/2.2, 1/1.2, 0/0.2} {
  \node[anchor=east] at (-0.35,\y) {\footnotesize $b_{\i}$};
  \draw (-0.3,\y) -- (1.5,\y);
}
\foreach \y in {3.2, 2.2, 1.2} { \node[circ] at (1.5,\y) {}; }

% g3 = b3 passes straight through
\draw (1.5,3.2) -- (3.9,3.2);
\node[anchor=west] at (3.95,3.2) {\footnotesize $g_{3}$};

\node[xor port, scale=0.55, anchor=in 2] (x2) at (2.4,2.2) {};
\node[xor port, scale=0.55, anchor=in 2] (x1) at (2.4,1.2) {};
\node[xor port, scale=0.55, anchor=in 2] (x0) at (2.4,0.2) {};

% own row -> lower input
\draw (1.5,2.2) -- (x2.in 2);
\draw (1.5,1.2) -- (x1.in 2);
\draw (1.5,0.2) -- (x0.in 2);
% row above -> upper input
\draw (1.5,3.2) -- (1.5,2.5) -- (x2.in 1);
\draw (1.5,2.2) -- (1.5,1.5) -- (x1.in 1);
\draw (1.5,1.2) -- (1.5,0.5) -- (x0.in 1);

\draw (x2.out) -- (3.9,2.2) node[anchor=west] {\footnotesize $g_{2}$};
\draw (x1.out) -- (3.9,1.2) node[anchor=west] {\footnotesize $g_{1}$};
\draw (x0.out) -- (3.9,0.2) node[anchor=west] {\footnotesize $g_{0}$};

\node[anchor=west] at (-0.9,-0.7) {\footnotesize $n$ in, $n$ out: $n-1$ XOR2, depth 1};

% ================= right: Gray -> binary, doubling prefix =================
\begin{scope}[xshift=7.6cm]
\node[anchor=west] at (-1.0,4.5) {\footnotesize\textbf{Gray $\to$ binary}};
\node[anchor=west] at (-1.0,4.0) {\footnotesize $b_i = \bigoplus_{j \ge i} g_j$, refolded};

\node[anchor=east] at (0.55,3.35) {\footnotesize $g$ \ ($n=8$)};
\draw[-latex] (0.7,3.5) -- (0.7,3.15);

\node[draw,minimum width=2.7cm,minimum height=0.6cm] (s1) at (0.7,2.85) {\footnotesize $x \oplus (x \gg 1)$};
\node[draw,minimum width=2.7cm,minimum height=0.6cm] (s2) at (0.7,1.75) {\footnotesize $x \oplus (x \gg 2)$};
\node[draw,minimum width=2.7cm,minimum height=0.6cm] (s4) at (0.7,0.65) {\footnotesize $x \oplus (x \gg 4)$};

\draw[-latex] (s1) -- (s2);
\draw[-latex] (s2) -- (s4);
\draw[-latex] (0.7,0.35) -- (0.7,0.0);
\node[anchor=north] at (0.7,-0.05) {\footnotesize $b$ \ ($n=8$)};

\node[anchor=west] at (2.2,2.85) {\footnotesize level 1};
\node[anchor=west] at (2.2,1.75) {\footnotesize level 2};
\node[anchor=west] at (2.2,0.65) {\footnotesize level 3};

\node[anchor=west] at (-1.0,-0.7) {\footnotesize $\lceil\log_2 n\rceil$ levels, $n\log_2 n-(n-1)$ XOR2};
\end{scope}

\end{circuitikz}
\end{document}
```

*Own construction; the 4-bit forward row is the standard textbook drawing (Mano & Ciletti §1.6, Wakerly §2.11), the doubling network on the right is the shift-XOR form.*

**Fix the encoding by a difference equation on adjacent bits.** For an unsigned $b \in \{0,\dots,2^n-1\}$ carried on $n$ wires, the reflected Gray codeword $g$ is defined bitwise by

$$g_i = b_i \oplus b_{i+1}, \qquad i = 0,\dots,n-1, \quad b_n \equiv 0$$

so $g$ is also $n$ bits and $g_{n-1} = b_{n-1}$ — the top bit passes through unchanged. Collecting the $n$ equations into one word operation, appending a zero above the MSB *is* a logical right shift by one, so the whole row is $g = b \oplus (b \gg 1)$: $n-1$ two-input XORs, one gate level, no carry, no dependence between bit positions. The encoding is a bijection on $n$-bit words because the map is unit-lower-triangular over $\mathrm{GF}(2)$, and a triangular matrix with $1$s on the diagonal is invertible over any field.

**One bit changes per increment, and here is why.** Write the current count as $b = \ldots x\,0\,1^{k}$ — a run of $k$ ones at the bottom, a zero above them, an arbitrary bit $x$ above that — so that $b+1 = \ldots x\,1\,0^{k}$ by the definition of binary carry propagation. Evaluating $g_i = b_i \oplus b_{i+1}$ on both words:

| $i$ | $g_i(b)$ | $g_i(b+1)$ |
| --- | --- | --- |
| $i<k-1$ | $1\oplus1=0$ | $0\oplus0=0$ |
| $i=k-1$ | $1\oplus0=1$ | $0\oplus1=1$ |
| $i=k$ | $0\oplus x=x$ | $1\oplus x=\bar{x}$ |
| $i>k$ | unchanged | unchanged |

Only $g_k$ differs, where $k$ is the number of trailing ones. $\square$ This single property is the entire reason the code exists in hardware: it makes a multi-bit bus safe to sample from a foreign clock, since only one flip-flop is ever in flight. The metastability argument that turns this into a correctness guarantee lives in [[Gray Counter]]; the converter is only the algebra.

**Invert by summing a suffix.** Solve $g_i = b_i \oplus b_{i+1}$ downward from the top, using that $\oplus$ is its own inverse ($a \oplus a = 0$): $b_{n-1} = g_{n-1}$, and $b_i = g_i \oplus b_{i+1}$. Unrolling that recurrence gives the closed form

$$b_i = \bigoplus_{j \ge i} g_j$$

The two directions are structurally different problems. Forward, each output depends on exactly two inputs — a fixed-fanin local difference. Backward, $b_0$ depends on all $n$ Gray bits — a *suffix reduction*, the same shape as a carry chain. Written naively as the recurrence it is $n-1$ XOR2 gates but $n-1$ gate levels deep, which for a 32-bit pointer is a chain nobody wants in a timing path.

**Reassociate the suffix into a tree.** XOR is associative and commutative, so the $n$ suffix sums may be bracketed any way at all: this is exactly the precondition for a [[Parallel Prefix Adders|parallel prefix]] treatment, with $\oplus$ as the associative operator in place of the carry operator $(g,p)\circ(g',p')$. Applying the Kogge-Stone doubling identity — after $k$ levels each bit holds the XOR of a window of $2^k$ consecutive Gray bits, so one more XOR with the value $2^k$ positions up doubles the window — gives the word-level recurrence

$$x^{(0)} = g, \qquad x^{(k+1)} = x^{(k)} \oplus (x^{(k)} \gg 2^{k}), \qquad b = x^{(\lceil \log_2 n\rceil)}$$

Each $x^{(k)}$ is $n$ bits wide; the shifts are hardwired, not computed. Level $k$ costs $n - 2^k$ XOR2 gates, so the total is $n\log_2 n - (n-1)$ gates in $\lceil\log_2 n\rceil$ levels — for $n=8$, $7+6+4 = 17$ gates and 3 levels, against 7 gates and 7 levels for the ripple form. The Sklansky bracketing instead computes each window once and fans it out, costing only $\tfrac{n}{2}\log_2 n$ gates at the same depth, at the price of fanout $n/2$ on the last level; on an ASIC that fanout usually needs buffering that eats the gate saving, so the doubling form is the honest default.

**On an FPGA the asymmetry mostly disappears.** A $K$-input LUT computes *any* Boolean function of $K$ inputs at a fixed delay, and $b_i$ is a function of the $n-i$ Gray bits above and including position $i$. With the $K=6$ LUTs of current Xilinx and Intel fabrics, every output bit of a converter with $n \le 6$ is one LUT — the Gray-to-binary direction costs the same *depth* as Gray-from-binary, and the $\log_2$ tree is invisible because the fabric already collapses six levels of XOR2 into one. Depth is $\lceil \log_6 n \rceil$ LUT levels, so an 8-bit or 32-bit pointer converter is two levels. The gate-count asymmetry is a real ASIC concern and largely an FPGA non-issue; what does not go away is that the forward direction never needed a tree in the first place, which is why a [[Gray Counter]] keeps a binary counter and converts forward, never backward, in its critical loop.

**Put the register on the Gray side, not before it.** Both networks are combinational and therefore hazardous: a converter fed by a register whose outputs skew by even a few picoseconds emits transient words that are neither the old nor the new codeword. If a Gray word crosses a clock boundary, the receiving domain samples asynchronously and *will* catch those glitches, destroying the one-bit-in-flight guarantee the code was chosen for. So compute $g^{+} = b^{+} \oplus (b^{+} \gg 1)$ from the incremented binary value and register $g^{+}$ directly, in parallel with the binary register. This adds one XOR level to the setup path and nothing to the increment loop.

$$\boxed{\ g_i = b_i \oplus b_{i+1}\ (b_n = 0), \qquad b_i = \bigoplus_{j\ge i} g_j\ }$$

**When it breaks.**

- **Odd moduli do not exist.** Each step flips one bit, so codeword parity alternates; a closed cycle of length $N$ needs $N$ even. There is no cyclic Gray code of odd length, which is why a non-power-of-two FIFO sizes its pointer to the next power of two.
- **Only $\pm1$ steps are protected.** The proof above is about $b \to b+1$. A jump of $2$, a preload, or a synchronous reset to a non-adjacent value flips several bits at once and hands the receiving domain a word that was never a count. Anything that can jump must be quiesced before it moves.
- **Adding Gray words is meaningless.** The code is order-preserving in no arithmetic sense; there is no borrow, no sign extension, no [[Number Formats|two's-complement]] structure. To do arithmetic, convert to binary, operate, convert back — which costs the tree.
- **This is *the* reflected code, not *a* Gray code.** Balanced and monotonic Gray codes exist and also flip one bit per step; the suffix-XOR decoder inverts only the reflected one.
- **Depth stops being free around $n \gtrsim 32$ on an ASIC.** Below that the tree is 5 levels and nothing else in the path cares; above it, the decoder is a genuine prefix-network design problem and the choices of [[Kogge-Stone Tree]] apply verbatim.

**RTL (Spade).**

```spade
fn bin2gray<#uint N>(b: uint<N>) -> uint<N> {
    b ^ (b >> 1)
}

fn gray2bin8(g: uint<8>) -> uint<8> {
    let s1 = g  ^ (g  >> 1);
    let s2 = s1 ^ (s1 >> 2);
    s2 ^ (s2 >> 4)
}
```

`bin2gray` is the left drawing verbatim: `>>` on `uint<N>` is a logical shift that returns `N` bits, so the zero shifted into position $n-1$ is the $b_n \equiv 0$ of the difference equation, and `^` is the bitwise XOR row — the shift is free wiring, so the whole entity is $n-1$ XOR2 at depth 1. `gray2bin8` is the right drawing, one `let` per level, all three signals `uint<8>`; nothing widens because `^` and `>>` are width-preserving, unlike `+`. Both are `fn`, not `entity`, because both are purely combinational — the register that makes the Gray word safe to cross a clock domain belongs to [[Gray Counter]], not here. Synthesis will not build the drawn XOR2 row on an FPGA: it collapses each output cone into one 6-LUT, and for `gray2bin8` the two widest cones (7 and 8 inputs) become two LUT levels rather than the three drawn.

**Related notes.**

- [[Gray Counter]] – depends-on: a binary counter plus this forward converter plus one register; the counter never instantiates the reverse direction.
- [[Kogge-Stone Tree]] – extends: the doubling recurrence above is that tree with $\oplus$ substituted for the carry operator, so its depth, fanout and wiring-congestion results transfer unchanged.
- [[Parallel Prefix Adders]] – compares: same associativity argument over a different operator; the decoder is the cheapest possible prefix problem because $\oplus$ needs no propagate bit.
- [[Barrel Shifters]] – counter-example: the shifts here are constant per level and cost only wiring, so the doubling network needs none of the mux stages a runtime shift amount forces.
- [[Johnson Counter]] – supports: a Johnson counter's state sequence is already a Gray code, so it decodes with two-input gates and needs no converter at all.

## References

- `2.8) Counters`, § *Gray counters* — the encoding, the one-bit-change proof, and the register-placement argument.
- Mano & Ciletti, *Digital Design*, §1.6 (Gray code) and §4.11 (XOR networks).
- Wakerly, *Digital Design: Principles and Practices*, §2.11.
- Weste & Harris, *CMOS VLSI Design*, ch. 11 — prefix-network depth/fanout tradeoffs, applied here with $\oplus$ as the operator.
- Cummings, "Simulation and Synthesis Techniques for Asynchronous FIFO Design" (SNUG) — why the Gray value is registered rather than converted after the register.
