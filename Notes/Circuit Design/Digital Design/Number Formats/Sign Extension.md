---
title: Sign Extension
description: "Widening a signed word for free: replicate the sign bit left, pad zeros right — fanout of one wire, no gates, no delay."
kind: circuit
source: "ASA §2.2.3, p. 42"
status: seed
spade: simulated
tags: [digital, number-formats, twos-complement, fixed-point, widening]
aliases:
  - Sign Extend
  - sext
  - Signed Widening
  - Conversion to a Wider Format
---

# Sign Extension

The value-preserving widening of a two's-complement word, and the only format conversion in the datapath that costs literally nothing: it is the fanout of a single wire, not a circuit.

```tikz title="Sign extension from sfix(3,-1) to sfix(5,-3): the sign bit is replicated left, zeros pad right, and the value is unchanged"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=1.05cm,y=1cm,font=\footnotesize]

% --- narrow word: sfix(3,-1), positions 3..-1 at x = 2..7 ---
\draw[fill=red!20] (2,1.9) rectangle ++(1,0.5);
\node at (2.5,2.15) {$1$};
\foreach \b/\j in {1/3,0/4,0/5,1/6} {
  \draw[fill=green!12] (\j,1.9) rectangle ++(1,0.5);
  \node at ({\j+0.5},2.15) {$\b$};
}

% --- wide word: sfix(5,-3), positions 5..-3 at x = 0..9 ---
\foreach \j in {0,1,2} {
  \draw[fill=red!20] (\j,0.4) rectangle ++(1,0.5);
  \node at ({\j+0.5},0.65) {$1$};
}
\foreach \b/\j in {1/3,0/4,0/5,1/6} {
  \draw[fill=green!12] (\j,0.4) rectangle ++(1,0.5);
  \node at ({\j+0.5},0.65) {$\b$};
}
\foreach \j in {7,8} {
  \draw[fill=blue!10] (\j,0.4) rectangle ++(1,0.5);
  \node at ({\j+0.5},0.65) {$0$};
}

% --- the one wire, fanned out ---
\draw[->,red!55!black] (2.4,1.9) to[out=250,in=90] (0.5,0.9);
\draw[->,red!55!black] (2.45,1.9) to[out=250,in=90] (1.5,0.9);
\draw[->,red!55!black] (2.5,1.9) -- (2.5,0.9);

% --- shared position axis ---
\foreach \i/\j in {5/0,4/1,3/2,2/3,1/4,0/5,-1/6,-2/7,-3/8} {
  \node at ({\j+0.5},0.05) {$\i$};
}
\node at (0.5,-0.45) {$m'$};
\node at (2.5,-0.45) {$m$};
\node at (6.5,-0.45) {$\ell$};
\node at (8.5,-0.45) {$\ell'$};

\node[left] at (-0.15,2.15) {$\mathrm{sfix}(3,-1)$, $w=5$};
\node[left] at (-0.15,0.65) {$\mathrm{sfix}(5,-3)$, $w'=9$};
\node[left] at (-0.15,0.05) {bit position $i$};

\node[right] at (9.15,2.15) {$-8+4+2^{-1}=-3.5$};
\node[right] at (9.15,0.65) {$-32+16+8+4+2^{-1}=-3.5$};
\node[right,red!55!black] at (9.15,1.4) {one wire, fanout $m'-m+1$};

\end{circuitikz}
\end{document}
```

*after Fig. 2.8, p. 42.*

**Fix what a widening is allowed to change.** The target is a conversion $\mathrm{sfix}(m,\ell)\to\mathrm{sfix}(m',\ell')$ with $m'\ge m$ and $\ell'\le\ell$, so the input is $w=m-\ell+1$ bits and the output is $w'=m'-\ell'+1$ bits — $m'-m$ new positions on the left and $\ell-\ell'$ new positions on the right. Positions are absolute weights, not offsets, so a bit that stays at position $i$ keeps weight $2^i$ and the only question is what to drive into the new ones. The unsigned case answers itself: in $\mathrm{ufix}$ every position contributes $2^i x_i\ge 0$, so zeros on both sides contribute nothing and the conversion is exactly decimal $17.42 = 0017.42000$ — errorless, and no logic. See [[Signed Fixed-Point Format]] for the weight convention this all rests on.

**Zero-padding on the left breaks the signed case, and by a specific amount.** In $\mathrm{sfix}(m,\ell)$ the value is $X=-2^{m}x_{m}+\sum_{i=\ell}^{m-1}2^{i}x_{i}$, so the MSB is the one position with a *negative* weight. Moving the format boundary to $m'>m$ and writing zeros above does not move that privilege with it: position $m$ is now an interior position of the wider format, and the same stored $x_m$ is read with weight $+2^{m}$ instead of $-2^{m}$. Every negative number gains $2^{m+1}$ and becomes positive. In the diagram, zero-padding would turn $-3.5$ into $8+4+2^{-1}=12.5$.

**One geometric sum repairs it.** The new positions $m,\dots,m'-1$ carry weights summing to $\sum_{i=m}^{m'-1}2^{i}=2^{m'}-2^{m}$ — the finite geometric series $\sum_{i=a}^{b-1}2^{i}=2^{b}-2^{a}$. Set all of them, and the new sign position $m'$, to $1$:

$$-2^{m'}+\sum_{i=m}^{m'-1}2^{i} \;=\; -2^{m'}+\bigl(2^{m'}-2^{m}\bigr) \;=\; -2^{m}$$

The wide format's sign weight plus a run of ones reconstructs the narrow format's sign weight exactly, so a negative number is left-padded with ones without changing its value. The identity is the entire content of sign extension; everything else is wiring.

**The two cases collapse into one unconditional wire.** A positive input has $x_m=0$ and needs zeros on the left; a negative input has $x_m=1$ and needs ones. Both are "copies of $x_m$", so the rule needs no sign test, no mux, no comparison — drive every new left position from the single wire $x_m$. This is why the operation is free and why it is total: unlike negation, which has no correct answer at $-2^{m}$ (see [[Two's Complement Negator]]), extension is exact on every one of the $2^{w}$ inputs.

**The right side is a scaling, not a widening of value.** Positions $\ell'\le i<\ell$ get zeros because $2^{i}\cdot 0=0$ contributes nothing to the sum, whichever weights they carry. Read the same wires as a plain integer instead of a fixed-point value and the statement changes shape: the stored integer is multiplied by $2^{\ell-\ell'}$ while the represented value stays put, since the ulp shrank by the same factor. That is the same object described in two coordinate systems — see [[Number Formats]] — and it is worth keeping straight because a testbench comparing integers must compare against $X\cdot 2^{\ell-\ell'}$, not against $X$.

**It is free where it happens and paid where it lands.** The extension itself is $m'-m+1$ loads on one net: zero gates, zero logic levels, zero area. What is not free is the operator downstream, which is now $w'$ bits wide instead of $w$ — a ripple-carry adder fed extended operands grows its carry chain by $m'-m$ full-adder stages, and those stages sit on the critical path. So the real design question is never "does the extension cost anything" but "how far up must I extend before the operator that consumes it", which is the worst-case MSB analysis of [[Fixed-Point Format Narrowing]] read backwards. On an FPGA the arithmetic is the same and the accounting is sharper: each extended bit position becomes one more LUT/carry-cell on the hard carry chain, while the replicated net itself is routing that the placer usually absorbs. Hard multiplier and DSP blocks partly refund this — their signed input ports do the extension internally, so extending a narrow operand to the block's native width costs nothing at all — but only up to the block's fixed width, past which you are back to logic ([[FPGAs]]).

**The cost turns quadratic when it is replicated per summand.** In a multi-operand sum every signed summand must be extended to the full accumulator width, so a heap of $n$ summands carries $n$ separate triangles of replicated sign bits, and those triangles are the dominant nuisance in [[Bit Heaps]] and in the array of partial products in [[Sums of Weighted Bits]]. Because each triangle is a run of copies of one bit, the whole set can be rewritten algebraically — the sign copies of every summand collapse into one complemented bit per summand plus a single compile-time constant row — which turns $O(n\cdot\Delta m)$ replicated bits into $n$ inverters and one constant. That rewrite is a separate note, but its premise is this one: sign extension is cheap in isolation and expensive in bulk.

**In redundant representations, extend every component.** A carry-save pair $(S,C)$ from a [[CSA, Carry-Save Adder]] does not have a sign bit; it has two ordinary $\mathrm{sfix}$ words whose sum is the value. Widening the pair means sign-extending $S$ and $C$ independently by the rule above — extending only one of them adds an unintended $\pm 2^{m}$-scale term to the represented value, and the bug survives to the final carry-propagate adder where it looks like a data-dependent offset rather than a format error.

$$\boxed{\ -2^{m}=-2^{m'}+\sum_{i=m}^{m'-1}2^{i}\ \Longrightarrow\ x_i := x_m\ (m\le i\le m'),\qquad x_i := 0\ (\ell'\le i<\ell)\ }$$

**When it breaks.**

- $m'<m$ is not extension at all — it is narrowing, and narrowing at the MSB is overflow, which destroys even the order of magnitude ([[Fixed-Point Format Narrowing]]). The rule above is valid only in the widening direction.
- The word must actually be two's complement. Applying it to a $\mathrm{ufix}$ word turns every value with a set MSB negative; applying it to sign-magnitude is wrong in a different way, because there the sign bit must *move* to the new MSB and the vacated positions take zeros, not copies ([[Sign-Magnitude to Two's Complement Converter]]).
- Signedness in the HDL, not in your head. Verilog's rule is that an expression is signed only if *every* operand is: one unsigned operand anywhere in the expression makes the whole thing unsigned and silently converts your extension into a zero-extension. This is the single most common way the identity above is correct on paper and absent from the netlist.
- Extension does not commute with wrapping arithmetic. $\mathrm{sext}(a +_w b) \ne \mathrm{sext}(a) + \mathrm{sext}(b)$ when the narrow add wraps — the wrap happened at position $m$, and extending afterwards faithfully preserves the wrapped value. Extend first, then add.
- "Free" has a fanout ceiling. At large $m'-m$ and high frequency the single net becomes a buffer tree with real delay and real power; it is free in gates, never free in wires. That ceiling is exactly what the constant-one rewrite above is buying back.

**RTL (Spade).**

```spade
/// sfix(m, l) -> sfix(m+G, l-P): G copies of the sign bit on the left,
/// P zeros on the right. Value-preserving, purely structural.
fn sign_extend<#uint W, #uint G, #uint P>(x: int<W>) -> int<{W + G + P}> {
    let wide: int<{W + G}> = sext(x);
    let pad: int<P> = 0;
    wide.concat(pad)
}
```

`sext` is the left half of the diagram — the red fanout — and `concat` is the right half, with `wide` as the high part and `pad` the low. The widths are the note's arithmetic verbatim: $w'=W+G+P$ where $G=m'-m$ and $P=\ell-\ell'$. It is a `fn`, not an `entity`, because there is nothing to clock; the whole thing is combinational and contains no gate. Synthesis does not build anything for it either — the emitted Verilog for the body is the single line `assign \wide = {{2{\x [7]}}, \x };`, a bit-select replication that the netlist flattens into net names, which is the strongest evidence available that the operation costs nothing. Note that `wide.concat(pad)` needs `pad` typed `int<P>`; a `uint<P>` is an argument-type error, even though the two are the same zero bits.

Compiled and simulated at $W=8, G=2, P=2$ (`int<8>` → `int<12>`, value scaled by $2^2$): 3009 vectors, including $+1$ against $-128$, $\pm 127$ and a 3000-vector random sweep checked against `$signed(x)*4` and against explicit replication of `x[7]` into bits 11 and 10. Replacing `sext` with a zero-extension makes the same testbench fail, which is the point of running it.

**Related Notes.**

- [[Signed Fixed-Point Format]] – depends-on: supplies the $-2^{m}x_{m}+\sum 2^{i}x_{i}$ weighting that makes left-padding a value change at all.
- [[Fixed-Point Format Narrowing]] – counter-example: the opposite direction is neither free nor errorless, and picking $m'$ is the whole cost of this note.
- [[Two's Complement Negator]] – compares: the other one-identity two's-complement primitive, but total only up to $-2^{m}$ where this one is total everywhere.
- [[Sign-Magnitude to Two's Complement Converter]] – counter-example: a format where widening moves the sign bit instead of replicating it.
- [[Bit Heaps]] – extends: where $n$ independent extensions become the dominant cost and get rewritten as one constant row.
- [[Sums of Weighted Bits]] – supports: partial-product arrays are the place this operation is applied most often and least visibly.
- [[CSA, Carry-Save Adder]] – depends-on: its redundant output pair must be extended component-wise, not as one word.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §2.2.3 "Conversion to a Wider Format: Sign Extension", p. 42 — the identity $-2^{m}=-2^{m'}+\sum_{i=m}^{m'-1}2^{i}$ and Fig. 2.8.
  - §2.2.2 "Two's Complement Fixed-Point Binary Representation", p. 41 — Eq. (2.8) and the range $[-2^{m},2^{m}-2^{\ell}]$.
  - §2.2.4 "Conversion to a Narrower Format", p. 43 — the narrowing direction, for contrast.
