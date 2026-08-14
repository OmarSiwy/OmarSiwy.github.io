---
title: Binary Encoder
description: "Inverse of a decoder as a wire-OR, log-depth and nearly free — but correct only on genuinely one-hot input, where two hot bits silently emit a third valid address."
kind: circuit
status: seed
spade: simulated
tags: [digital, combinational-logic]
aliases:
  - Encoder
  - Encoders
  - Binary Encoders
  - 8-to-3 Encoder
  - Octal-to-Binary Encoder
---

# Binary Encoder

A $2^n\!\to\!n$ encoder returns the index of the asserted input line as an $n$-bit unsigned address, and it is the only block in the standard set whose correctness is a *precondition on its input* rather than a property of its own logic.

```tikz title="8-to-3 binary encoder drawn as three wire-OR rails plus a validity rail"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- 8 one-bit input lines, index ascending left to right ----
  \foreach \i in {0,...,7} {
    \draw[black!70] (\i,2.0) -- (\i,-1.35);
    \node[anchor=south] at (\i,2.05) {$x_{\i}$};
  }
  \node[anchor=east] at (-0.75,2.15) {8 lines, 1 bit each};

  % ---- collector rails: one per output bit, plus validity ----
  \foreach \y/\lbl in {1.4/{$y_2$}, 0.7/{$y_1$}, 0/{$y_0$}, -0.9/{$v$}} {
    \draw[black!70] (-0.6,\y) -- (8.3,\y);
    \node[anchor=east] at (-0.7,\y) {\lbl};
    \draw (8.3,{\y-0.24}) rectangle (9.4,{\y+0.24});
    \node at (8.85,\y) {OR};
    \draw[->] (9.4,\y) -- (10.2,\y);
  }
  \node[anchor=west] at (10.25,1.4) {$y_2$};
  \node[anchor=west] at (10.25,0.7) {$y_1$};
  \node[anchor=west] at (10.25,0) {$y_0$};
  \node[anchor=west] at (10.25,-0.9) {valid};
  \node[anchor=west, text=black!60] at (11.15,0.35) {\footnotesize $y[2{:}0]$, 3 bits};

  % ---- taps: x_i drives rail k iff bit k of i is 1 ----
  \foreach \i in {1,3,5,7} \fill (\i,0)   circle (1.9pt);   % bit 0 of the address
  \foreach \i in {2,3,6,7} \fill (\i,0.7) circle (1.9pt);   % bit 1
  \foreach \i in {4,5,6,7} \fill (\i,1.4) circle (1.9pt);   % bit 2
  \foreach \i in {0,...,7} \fill (\i,-0.9) circle (1.9pt);  % validity

  \node[anchor=west, text=black!60] at (-0.75,-1.85)
    {\footnotesize a dot at $(x_i,\,y_k)$ means bit $k$ of the address $i$ is 1 --- each rail is a 4-input OR, depth $\lceil\log_2 4\rceil=2$};
  \node[anchor=west, align=left] at (-0.75,-2.65)
    {two hot inputs are not an error, they are an address:\\
     $x=\texttt{00011000}$ taps rails for $3=\texttt{011}$ and $4=\texttt{100}$, emitting $\texttt{111}=7$.};
\end{circuitikz}
\end{document}
```

**Derive the equations by reading the decoder's truth table backwards.** A [[Binary Decoder]] maps an $n$-bit address to $2^n$ one-hot lines, $Y_i = \prod_j x_j^{(i_j)}$, so its inverse must map the position of the single asserted line back to its index. Input $x$ is $2^n$ bits wide, output $y$ is $n$ bits. On a genuinely one-hot input exactly one $x_i$ is 1, so bit $k$ of the answer is exactly bit $k$ of that $i$; summing over the $2^n$ mutually exclusive cases with OR gives

$$y_k \;=\; \bigvee_{i \,:\, i_k = 1} x_i, \qquad k = 0,\dots,n-1$$

No AND appears anywhere. Because the cases are mutually exclusive under the one-hot precondition, the product term that would normally guard each address collapses to the literal $x_i$ itself — that collapse is the entire circuit, and it is also the entire fragility.

**Count the fan-in to get cost and depth.** Exactly half the addresses in $\{0,\dots,2^n-1\}$ have bit $k$ set, so every output rail is an OR of $2^{n-1}$ inputs — $n$ gates of $2^{n-1}$ inputs, which is the row in the standard-block table. OR is associative, so the flat rail may be reassociated into a balanced binary tree of $2^{n-1}-1$ two-input gates and depth $\lceil\log_2 2^{n-1}\rceil = n-1$. The whole address costs $n\,(2^{n-1}-1)$ OR2 and the $n$ rails are independent, so depth stays $n-1$ regardless of $n$: for $n=3$, 9 OR2 at depth 2. Compare the decoder it inverts, which needs $2^n$ AND gates of $n$ inputs each — $n2^n$ gate inputs against the encoder's $n2^{n-1}$. Inverting the map halves the wiring because there is no complement to generate.

**Validity is a separate reduction, not a spare output.** The address alone cannot distinguish $x=0$ from a one-hot at position 0, since both drive every rail low. A companion output

$$v \;=\; \bigvee_{i=0}^{2^n-1} x_i$$

costs a further $2^n-1$ OR2 at depth $n$ — more gates than all $n$ address rails combined, and one level deeper, because it is the only signal that touches every input. That asymmetry is why the valid flag usually arrives one gate later than the address it qualifies, and why a consumer that gates on $v$ pays the encoder's true critical path.

**Two hot inputs produce a legal address for neither.** Feed $x$ with bits 3 and 4 set: rail $y_0$ and $y_1$ are tapped by index 3 $=\texttt{011}$, rail $y_2$ by index 4 $=\texttt{100}$, and the output is $\texttt{111}=7$. In general the circuit computes the bitwise OR of the addresses of all hot inputs, which for one-hot input reduces to the index and otherwise reduces to nothing meaningful. There is no code point left over to signal the violation — every $n$-bit pattern is a valid address — so the failure is silent by construction, not by oversight.

> [!note] The encoder cannot detect its own precondition
> Checking "at most one bit set" is a separate circuit of comparable cost to the encoder itself, and $v$ does not do it: $v=1$ says at least one input is hot, never exactly one. If the source of $x$ cannot guarantee one-hotness, do not add a checker — replace the block with a [[Priority Encoder]], which redefines the output as the index of the highest set bit and therefore has no precondition to violate.

**One-hotness is usually structural, which is why the plain encoder survives.** The vectors this block is fed almost always come from something that produces one-hot by construction: a decoder being undone, the match lines of a CAM or an SRAM row-select plane, the state register of a one-hot-encoded machine, or the select side of a [[One-Hot Multiplexer]]. In those settings the precondition is an invariant of the surrounding structure and the encoder is a handful of gates on a path nobody times. It is interrupt request lines, arbitration grants and any bus of independently-asserted flags that break the invariant, and those are exactly the places a priority encoder is standard.

**In CMOS the wire-OR is often literal.** Each rail can be a single pseudo-nMOS or dynamic NOR plane rather than a gate tree — one precharged line per output bit with $2^{n-1}$ pulldowns on it — which is how an SRAM or CAM address-out plane is actually built, and it makes the encoder nearly free in area at the cost of a precharge phase. On an FPGA there is no such plane: an $N$-input OR packs into $\lceil (N-1)/(k-1) \rceil$ $k$-LUTs at depth $\lceil \log_k N \rceil$. For $n=3$ each address rail is an OR4 and fits in one LUT6 at depth 1, while $v$ is an OR8 needing $\lceil 7/5 \rceil = 2$ LUTs at depth 2 — 5 LUTs total, and the valid flag is again the deeper signal. For $n=6$ each address rail ORs 32 inputs, $\lceil 31/5 \rceil = 7$ LUT6 at depth 2, and $v$ ORs 64 inputs, $\lceil 63/5 \rceil = 13$ LUT6 at depth 3: a $64\!\to\!6$ encoder is 55 LUTs and three levels. Depth grows logarithmically in either technology; only the base of the logarithm moves.

$$\boxed{\ y \;=\; \bigvee_{i \,:\, x_i = 1} i \ }$$

The encoder computes the bitwise OR of the addresses of every asserted input. One-hot input is the special case where that OR has a single term and the result is the index; everything the block gets wrong follows from reading this identity with two terms.

**When it breaks.** More than one hot bit — silent, and the wrong answer is a well-formed address. All-zero input — indistinguishable from index 0 without $v$. Glitches: rails are wide ORs of signals that may switch at different times, so a transient extra hot bit produces a transient wrong address; if the consumer is level-sensitive see [[Logic Hazards]]. Depth $n-1$ only holds if the synthesiser is free to rebalance the OR, which it is — but the flat rail in the drawing is not what gets built. Past roughly $n=6$ on an ASIC the wide OR's own wire load, not its logical depth, sets the delay, and the pseudo-nMOS plane starts to be the only sensible implementation. And the moment the one-hot guarantee comes from a bus rather than a decoder, the sibling takes over entirely.

**Transcribe the tap pattern directly into RTL.**

```spade
// 8 -> 3 binary encoder: three wire-ORs plus a validity OR.
fn enc8(x: uint<8>) -> (uint<3>, bool) {
    let b = x.as_bits();                       // index 0 = LSB
    let y0 = b[1] || b[3] || b[5] || b[7];     // addresses with bit 0 set
    let y1 = b[2] || b[3] || b[6] || b[7];     // bit 1 set
    let y2 = b[4] || b[5] || b[6] || b[7];     // bit 2 set
    let v  = b.reduce_or();
    ([y0, y1, y2].as_uint(), v)
}
```

`b[i]` is the vertical line $x_i$ in the drawing and each `||` chain is one horizontal rail, with the tap pattern transcribed straight from $i_k = 1$. Widths: input $2^3 = 8$ bits, address 3 bits, valid 1 bit — no arithmetic, so no width growth to manage, and `[y0, y1, y2].as_uint()` relies on array element 0 packing into the LSB. It is a `fn`, so purely combinational with no clock. Synthesis will not build the flat rail the diagram shows: `||` is associative, so the tool rebalances each 4-input OR into whatever tree or single LUT its target prefers, which is the whole reason depth is $\lceil\log_2 4\rceil = 2$ and not 3.

Verified by simulation against a behavioural reference that ORs the indices of all set bits: 7 named vectors including the asymmetric pair $x=\texttt{00000001}\to 0$ and $x=\texttt{10000000}\to 7$ (which a bit-reversed rail assignment would swap), 3000 random inputs, and an exhaustive sweep of all 256 — 3263 vectors, no failures.

**Related Notes**

- [[Binary Decoder]] – counter-example: the exact inverse map, and the block whose output is the one input this encoder is safe on.
- [[Priority Encoder]] – extends: drops the one-hot precondition by masking with a prefix-OR before the same wire-OR runs.
- [[One-Hot Multiplexer]] – supports: consumes the same one-hot vector this block consumes, and fails the same way on two hot bits.
- [[Choosing a Combinational Block]] – compares: where the encoder sits against decoder, mux and comparator on cost and depth.

## References

- `0.2) Combinational Logic.md`, "Standard blocks" — block table and the "Encoders and priority encoders" paragraph.
- Mano & Ciletti, *Digital Design*, "Encoders" — octal-to-binary encoder and the ambiguity of non-one-hot input.
- Wakerly, *Digital Design: Principles and Practices*, "Encoders" — the valid output and its cost relative to the address rails.
