---
title: "Sign-Magnitude Accumulator"
description: "The rejected alternative — add or subtract by relative sign, then re-negate on zero crossing — which needs a compound adder to keep two w_A-bit carry chains off the loop."
kind: circuit
source: "ASA §21.2.2.4, p. 634; §5.3.7, p. 123"
status: seed
spade: simulated
tags: [digital, exact-accumulators]
aliases:
  - Sign-Magnitude Accumulator
  - Sign-Magnitude Accumulators
  - Sign/Magnitude Accumulator
  - Sign-Magnitude Exact Accumulator
  - Two's Complement Versus Sign-Magnitude
---

# Sign-Magnitude Accumulator

An exact accumulator whose state is a sign bit plus an unsigned magnitude, so each summand is an effective add or an effective subtract, and the zero crossing that follows a subtract puts a **second $w_A$-bit carry propagation inside the loop** unless a compound adder is used to run both in parallel.

```tikz title="Sign-magnitude accumulator loop: one XOR row, one compound adder producing both carry-in cases, an inverter row, and the magnitude and sign muxes"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= inputs =================
  \draw[->] (4.0,10.6) -- (4.0,9.5);
  \node[anchor=south] at (4.0,10.62) {$X_{\text{fix}}$ (magnitude)};
  \node[anchor=west,scale=0.8] at (4.06,10.05) {$w_A$};

  \draw (12.4,10.6) -- (12.4,5.0) -- (9.2,5.0);
  \draw[->] (9.2,5.0) -- (9.2,4.7);
  \node[anchor=south] at (12.4,10.62) {$s_X$};

  % ================= effective-operation xor =================
  \node[xor port, scale=0.7, xscale=-1] (eop) at (8.9,9.1) {};
  \draw (12.4,9.28) -- (eop.in 1);
  \fill (12.4,9.28) circle (0.05);
  \draw (11.3,8.92) -- (eop.in 2);
  \node[anchor=south,scale=0.8] at (10.3,9.3) {$s_X$};
  \node[anchor=north,scale=0.8] at (10.4,8.9) {$s_A$};

  \draw (eop.out) -- (7.7,9.1);
  \draw[->] (7.7,9.1) -- (6.5,9.1);
  \fill (7.7,9.1) circle (0.05);
  \node[anchor=south,scale=0.8] at (7.1,9.12) {eop};

  % ================= xor row =================
  \draw (1.5,8.7) rectangle (6.5,9.5);
  \node at (4.0,9.1) {XOR row: $X' = X_{\text{fix}} \oplus \text{eop}$};
  \draw[->] (4.0,8.7) -- (4.0,8.1);
  \node[anchor=west,scale=0.8] at (4.06,8.35) {$w_A$};

  % ================= compound adder =================
  \draw (1.0,6.9) rectangle (7.0,8.1);
  \node[align=center] at (4.0,7.5)
    {compound adder\\[-1pt] \scriptsize one prefix tree, two sum-completion rows};

  \draw[->] (2.5,6.9) -- (2.5,6.3);
  \draw[->] (5.5,6.9) -- (5.5,4.7);
  \node[anchor=west,scale=0.8] at (2.58,6.58) {$S_0 = A + X'$};
  \node[anchor=west,scale=0.8] at (5.58,6.68) {$S_1 = A + X' + 1$};
  \node[anchor=west,scale=0.75] at (5.58,5.30) {$w_A{+}1$};

  % S0 also feeds the mux directly (effective add)
  \draw (2.5,6.80) -- (1.2,6.80);
  \fill (2.5,6.80) circle (0.05);
  \draw[->] (1.2,6.80) -- (1.2,4.7);
  \node[anchor=east,scale=0.75] at (1.14,5.6) {$w_A$};

  % carry-out tap
  \draw (5.5,6.05) -- (9.8,6.05);
  \fill (5.5,6.05) circle (0.05);
  \node[anchor=south west,scale=0.8] at (7.85,6.10) {$c_{\text{out}} = \text{msb}(S_1)$};
  \draw (7.15,6.05) -- (7.15,4.2);
  \fill (7.15,6.05) circle (0.05);
  \draw[->] (7.15,4.2) -- (6.1,4.2);
  \draw[->] (9.8,6.05) -- (9.8,4.7);

  % eop down to both muxes
  \draw (7.7,9.1) -- (7.7,4.5);
  \draw[->] (7.7,4.5) -- (6.1,4.5);
  \draw (7.7,5.3) -- (8.6,5.3);
  \fill (7.7,5.3) circle (0.05);
  \draw[->] (8.6,5.3) -- (8.6,4.7);

  % ================= inverter row =================
  \draw (1.6,5.5) rectangle (3.4,6.3);
  \node[scale=0.9] at (2.5,5.9) {$\sim$ (no carry)};
  \draw[->] (2.5,5.5) -- (2.5,4.7);
  \node[anchor=east,scale=0.75] at (2.44,5.1) {$w_A$};

  % ================= magnitude mux =================
  \draw (0.9,4.0) rectangle (6.1,4.7);
  \node at (3.5,4.35) {$3{:}1$ magnitude mux};
  \draw[->] (3.5,4.0) -- (3.5,3.2);
  \node[anchor=west,scale=0.8] at (3.56,3.6) {$w_A$};

  % ================= sign mux =================
  \draw (8.2,4.0) rectangle (10.6,4.7);
  \node[scale=0.9] at (9.4,4.35) {sign mux};
  \draw (11.3,4.35) -- (10.6,4.35);
  \fill (11.3,4.35) circle (0.05);
  \node[anchor=south,scale=0.75] at (11.0,4.37) {$s_A$};
  \draw[->] (9.2,4.0) -- (9.2,3.2);

  % ================= registers =================
  \draw (1.5,2.4) rectangle (6.5,3.2);
  \node at (4.0,2.8) {$|A|$ register, $w_A$ bits};
  \draw (8.2,2.4) rectangle (10.6,3.2);
  \node[scale=0.9] at (9.4,2.8) {$s_A$ register};

  % magnitude feedback
  \draw (1.5,2.8) -- (0.0,2.8) -- (0.0,7.5);
  \draw[->] (0.0,7.5) -- (1.0,7.5);
  \node[anchor=east,scale=0.8] at (-0.06,5.2) {$A$: $w_A$};

  % sign feedback
  \draw (10.6,2.8) -- (11.3,2.8) -- (11.3,8.92);

  % ================= outputs =================
  \draw[->] (4.0,2.4) -- (4.0,1.5);
  \draw[->] (9.4,2.4) -- (9.4,1.5);
  \node[anchor=west,scale=0.8] at (4.06,1.75) {$|A|$: $w_A$};
  \node[anchor=west,scale=0.8] at (9.46,1.75) {$s_A$: $1$};
  \node[anchor=north,scale=0.85] at (6.7,1.45) {to the FixToFloat converter};
\end{circuitikz}
\end{document}
```

**Fix the state before counting the cost.** The accumulator holds a sign bit $s_A$ and an unsigned magnitude $|A|$ on $w_A$ bits, so the register is $w_A+1$ bits wide and represents $(-1)^{s_A}\cdot|A|$ — the same encoding [[Floating-Point Formats]] uses for a significand, applied to the whole fixed-point word. $w_A$ is sized exactly as in [[Exact Accumulators]]: $m_A$ from the largest expected sum, $\ell_A$ from the target accuracy. The summand arrives from [[Sign-Padding Alignment Shifter]] as a pair $(s_X, X_{\text{fix}})$ with $X_{\text{fix}}$ on $w_A$ bits — and here it is genuinely a *magnitude*, so the shifter pads with zeros on both sides and the sign-padding trick of Fig. 21.9 is not needed. That is the one thing this architecture makes cheaper, and it is a handful of gates.

**Turn the two signs into one control bit.** The effective operation is $\text{eop} = s_A \oplus s_X$: one XOR gate. When $\text{eop}=0$ the magnitudes add and the sign is unchanged; when $\text{eop}=1$ the smaller magnitude must be subtracted from the larger and the result takes the sign of whichever operand was larger. The comparison and the subtraction are the same computation — $|A|-|X|$ is negative exactly when $|X|$ is larger — so no separate comparator is needed, but the *consequence* is expensive.

**The re-negation is a second carry propagation.** If the subtraction is done in the obvious order, the circuit computes $D = |A| - |X|$ on $w_A$ bits and then, when $D<0$, negates it by the two's-complement identity $-D = \overline{D}+1$. The bitwise complement is free; the $+1$ is an increment across $w_A$ bits, which is a carry propagation of the same length as the subtraction that produced $D$. The loop-carried path is then **two $w_A$-bit carry chains in series**, and $w_A$ is 277 bits for an exact binary32 sum and 554 for a sum of products (Tables 21.1–21.2). That is the whole objection: the same $w_A$ that makes the accumulator exact makes the second chain unaffordable.

**Collapse the two chains with one compound adder.** The repair is the identity that both chains compute the same difference with opposite sign. Write $\overline{X} = 2^{w_A}-1-X$ (definition of bitwise complement on $w_A$ bits) and let

$$S_0 = |A| + \overline{|X|}, \qquad S_1 = S_0 + 1 = |A| + \overline{|X|} + 1 = |A| - |X| + 2^{w_A}$$

the last step by the two's-complement identity $-x = \overline{x}+1$. Two cases, and both are read off $S_1$'s carry-out $c_{\text{out}} = \text{msb}(S_1)$:

- $|A| \ge |X|$: then $S_1 \ge 2^{w_A}$, so $c_{\text{out}}=1$ and the low $w_A$ bits of $S_1$ are exactly $|A|-|X|$;
- $|A| < |X|$: then $c_{\text{out}}=0$, and taking the complement of the *other* sum,
  $$\overline{S_0} = 2^{w_A}-1-\left(|A|-|X|-1+2^{w_A}\right) = |X|-|A|$$
  which is the magnitude wanted, obtained by an **inverter row and no carry at all**.

So the second carry chain is not needed: it is replaced by the $+1$ branch of a **compound adder** (§5.3.7, p. 123), which computes $X+Y$ and $X+Y+1$ from a single parallel-prefix tree — the only part of the tree that depends on the carry-in is the bottom row of prefix operators, whose size is linear in $w$, so duplicating it is cheap. This is the same "evaluate both carry-in cases, select afterwards" argument as the [[Carry-Select Adder]], applied to the carry-in of the whole word rather than to a block boundary.

**Fold the addition case into the same adder.** Put an XOR row on the summand ahead of the adder, $X' = X_{\text{fix}} \oplus \text{eop}$ (broadcast $\text{eop}$ to $w_A$ bits), and one compound adder covers everything: for $\text{eop}=0$ it produces $S_0 = |A|+|X|$, the wanted sum; for $\text{eop}=1$ it produces $S_1 = |A|-|X|$ and $\overline{S_0} = |X|-|A|$. The magnitude mux is $3{:}1$ on $w_A$ bits, selected by $(\text{eop}, c_{\text{out}})$, and the sign mux is $2{:}1$ on one bit, picking $s_X$ only in the third case. Both adder outputs are $w_A+1$ bits; only the low $w_A$ are kept, since bit $w_A$ carries no information once $c_{\text{out}}$ has been used as a selector.

**Count what is actually in the loop.** The loop-carried path is now XOR row → compound adder → $3{:}1$ mux → register: one carry propagation plus two levels of logic, against the [[Two's-Complement Exact Accumulator]]'s bare adder → register. The area difference is a duplicated sum-completion row, a $w_A$-bit $3{:}1$ mux and $w_A$ inverters — the book's verdict is simply that "these solutions ... involve more hardware than a two's complement accumulator" (p. 634), with the detailed study left to a citation.

> [!warning] No cost figures for this variant in the source
> ASA gives no LUT, area or delay numbers for the sign-magnitude accumulator; it names the compound-adder repair and points to its reference UD17 for the detailed comparison. The area and delay claims above are structural counts, not measurements — needs outside research to quantify.

**On FPGA the gap widens.** A two's-complement accumulator maps almost perfectly: the logic cell provides a flip-flop directly behind the adder bit, so the register is free, addition rides the hard carry chain, and the feedback is local routing within one column — a 64-bit accumulator clocks above 200 MHz (p. 635). The sign-magnitude version breaks all three properties at once. The compound adder needs two carry chains or a carry-select structure, doubling the scarcest resource in the column; the $3{:}1$ mux and the inverter row are LUT logic *after* the chain, so the flip-flop behind the adder bit is no longer the register that holds the state; and the $c_{\text{out}}$ fan-out from the top of the word back down to every mux bit is a global net inside the loop. See [[FPGAs]] for the underlying cell structure.

> [!important] It cannot be chunked, and that is what kills it
> The reason a wide two's-complement accumulator reaches any frequency at all is the high-radix carry-save trick: stop the carry every $\alpha$ bits and hold the deferred carries in $k-1$ flip-flops, so the loop's critical path is $\alpha$ bits instead of $w_A$ ([[High-Radix Carry-Save Accumulator]]). That works because a redundant radix-$2^\alpha$ representation still stores the value **exactly** — nothing in the loop needs to know it. Sign-magnitude does need to know it: the selector $c_{\text{out}}$ is the carry out of the *whole* word, and a carry-save representation does not expose it without a full propagation. So a sign-magnitude accumulator's frequency is tied to $w_A$ with no escape, exactly at the widths ($277$, $554$, $4196$ bits) where exact accumulation lives.

**The conversion argument does not rescue it either.** A tempting defence is that the two's-complement accumulator must be converted to sign-magnitude anyway, since IEEE output is sign-magnitude. It must — but in [[Accumulator-to-Float Converter]] that negation happens *after* normalisation, on $w'_F+1$ bits, and it is folded for free into the round-and-pack adder. Doing it in sign-magnitude form pays $w_A$ bits per cycle, inside the loop, to avoid $w'_F+1$ bits once, outside it. For binary32 output that is 554 bits per cycle against 25 bits once.

$$\boxed{\ (s_k,\,|A_k|) \;=\;
\begin{cases}
(s_{k-1},\ S_0) & \text{eop}=0\\[2pt]
(s_{k-1},\ S_1) & \text{eop}=1,\ c_{\text{out}}=1\\[2pt]
(s_{X_k},\ \overline{S_0}) & \text{eop}=1,\ c_{\text{out}}=0
\end{cases}
\quad\text{with}\quad
\begin{aligned}
\text{eop} &= s_{k-1}\oplus s_{X_k}\\
S_0 &= |A_{k-1}| + (X_{\text{fix},k}\oplus\text{eop})\\
S_1 &= S_0+1,\quad c_{\text{out}}=\text{msb}(S_1)
\end{aligned}\ }$$

## When it breaks

- **Overflow is not benign.** The two's-complement accumulator wraps modulo $2^{w_A}$, and wraparound is harmless because $\mathbb{Z}\to\mathbb{Z}/2^{w_A}\mathbb{Z}$ is a ring homomorphism, so an intermediate excursion out of range cancels correctly later. Sign-magnitude has no such structure: once $|A|+|X|$ carries out of bit $w_A-1$, the magnitude is simply wrong and stays wrong. $m_A$ must bound every *intermediate* sum, not just the final one, and Kulisch's spurious-overflow guard bits stop being optional.
- **Two encodings of zero.** $|A|=0$ with either sign is reachable — an exact cancellation with $\text{eop}=1$ and $|A|=|X|$ leaves $c_{\text{out}}=1$, magnitude $0$, and the *old* sign. Harmless for the value, but any zero test must ignore the sign bit, and the accumulator's sign is not the sign of the sum when the sum is zero.
- **Narrow accumulators.** Below roughly 16–32 bits the second carry chain is a few gate delays and either encoding meets timing; the whole argument only bites at the widths that exact accumulation forces. If you are building a small application-specific accumulator ($w_A = 63$ in the inductance example, p. 629) the choice is nearly free — and then the sign-available-every-cycle property is a mild convenience.
- **This is an implementation choice, not an accuracy one.** Both encodings hold $\sum_i a_i$ in $\mathbb{Z}$ and both are order-independent and exact. Nothing in [[Error Accuracy]] distinguishes them; only the loop delay does.

## RTL (Spade)

One iteration of the recurrence, then the loop it sits in:

```spade
/// One iteration: (s_A, |A|) x (s_X, |X|) -> (s_A', |A'|)
fn sm_step<#uint W>(sa: bool, a: uint<W>, sx: bool, x: uint<W>) -> (bool, uint<W>) {
    let eop = sa ^^ sx;                        // effective operation: true = subtract
    let xe  = if eop { ~x } else { x };        // the w_A-bit XOR row

    // compound adder: one prefix tree, two sum-completion rows
    let s0: uint<{W + 1}> = a + xe;            // A + X'
    let s1: uint<{W + 1}> = trunc(a + xe + 1); // A + X' + 1
    let ge = s1.msb();                         // c_out: |A| >= |X| when eop

    let t0: uint<W> = trunc(s0);
    let t1: uint<W> = trunc(s1);

    if !eop      { (sa, t0) }                  // magnitudes add
    else if ge   { (sa, t1) }                  // |A| - |X|, sign unchanged
    else         { (sx, ~t0) }                 // |X| - |A| = ~(A + ~X), sign flips
}

entity sm_acc<#uint W>(clk: clock, rst: bool, sx: bool, x: uint<W>) -> (bool, uint<W>) {
    decl nxt;
    reg(clk) (sa, a) reset(rst: (false, 0)) = nxt;
    let nxt = sm_step::<W>(sa, a, sx, x);
    (sa, a)
}
```

`xe` is the XOR row, `s0`/`s1` are the two sum-completion rows of the compound adder, `ge` is the $c_{\text{out}}$ tap, `~t0` is the inverter row, and the `if`/`else if`/`else` is the $3{:}1$ magnitude mux together with the $1$-bit sign mux — every wire in the drawing appears once. Only `reg(clk) (sa, a)` is registered; everything else is the combinational loop body, so the clock period must cover the whole chain. Writing `a + xe` and `a + xe + 1` as two expressions is what lets a synthesiser share one prefix tree between them — nothing in the language forces it, and on FPGA the likely outcome is two independent hard carry chains rather than one compound adder.

**Iteration count and loop control.** $N$ summands take exactly $N$ cycles, one per cycle, with no flush: unlike the chunked two's-complement accumulator, which needs $k=\lceil w_A/\alpha\rceil$ extra cycles of $X_{\text{fix}}=0$ to resolve its deferred carries, this register always holds the fully propagated value. Loop control is therefore only an enable bit on the register plus the exception FSM of [[Accumulator Exception FSM]] — no counter, no end-of-stream sequencing. That is the entire compensation for a clock period that scales with $w_A$.

## Related Notes

- [[Two's-Complement Exact Accumulator]] – compares: the architecture that wins, with one plain adder and nothing else in the loop.
- [[High-Radix Carry-Save Accumulator]] – counter-example: the chunking that decouples frequency from $w_A$, and which this encoding structurally cannot use.
- [[Carry-Select Adder]] – supports: the same evaluate-both-carry-ins-and-select idea, here as the compound adder that shares one prefix tree.
- [[Accumulator-to-Float Converter]] – depends-on: where the two's-complement result becomes sign-magnitude anyway, on $w'_F+1$ bits instead of $w_A$.
- [[Sign-Padding Alignment Shifter]] – compares: the sign-padding it makes unnecessary, this architecture's one saving.
- [[Accumulator Exception FSM]] – supports: the infinity/NaN handling, identical in both encodings.
- [[Choosing an Accumulator]] – compares: where this sits against every sibling.
- [[Adders]] – depends-on: the compound fast adder of §5.3.7 that makes the loop affordable at all.
- [[Floating-Point Formats]] – depends-on: the sign-magnitude encoding this applies to the whole accumulator word.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §21.2.2.4 "Two's Complement Versus Sign-Magnitude" — the second carry propagation, the compound-adder repair, and the conversion argument: p. 634
- §21.2.2.1 "Exact Accumulator", Figs. 21.8 and 21.9 — the two's-complement baseline and the sign-padding shifter: pp. 632–633
- §21.2.2.3 "Application-Specific Accumulator" — overflow detection against $m_A$: p. 634
- §21.2.3 "High-Radix Carry-Save Architecture", Fig. 21.10 — $\alpha$-chunking and the $k$ flush cycles: pp. 635–636
- §21.2.4 "Conversion of the Accumulator Back to Floating Point", Fig. 21.11 — negation after normalisation on $w'_F$ bits: pp. 636–637
- §5.3.7 "Compound Fast Adder", Fig. 5.20 — $X+Y$ and $X+Y+1$ from one prefix tree: p. 123
- FPGA logic-cell mapping and the 200 MHz 64-bit accumulator: p. 635
- Tables 21.1 and 21.2 — the $w_A$ values that make the second carry chain unaffordable: pp. 626–627
