---
title: Restoring Division
description: "Cheapest divider there is — one subtractor and one mux per quotient bit — at w_Q cycles of latency, each a full carry propagation followed by the sign bit and the mux."
kind: circuit
source: "ASA §9.2.1, pp. 266-269"
status: seed
spade: simulated
tags: [digital, divider, digit-recurrence, restoring, iterative]
aliases:
  - Restoring Divider
  - Schoolbook Binary Division
  - Binary Restoring Algorithm
---

# Restoring Division

The radix-2 digit recurrence that guesses $q_i = 1$, subtracts, and undoes the subtraction through a multiplexer when the sign bit says the guess was wrong — the only divider whose per-iteration hardware is a single subtractor and a single mux.

```tikz title="Hardware for one iteration of restoring division: subtractor, sign bit, restore multiplexer"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- left input: previous remainder, with the next bit of X shifted in ---
  \draw (-3.5,5.6) -- (-3.5,4.8);
  \node[anchor=south] at (-3.5,5.62) {$\lfloor R'_i\rfloor$};
  \node[anchor=east] at (-3.55,5.15) {$w_D$};
  \draw (-1.9,5.6) -- (-1.9,4.8);
  \node[anchor=south] at (-1.9,5.62) {$x_{w_X-1-i}$};
  \node[anchor=west] at (-1.85,5.15) {$1$};
  \draw[line width=1pt] (-3.5,4.8) -- (-1.9,4.8);
  \draw[line width=1pt] (-2.7,4.8) -- (-2.7,3.6);
  \node[anchor=west] at (-2.6,4.25) {$\lfloor 2R'_i\rfloor$, $w_D{+}1$};

  % --- right input: divisor, zero-extended into the sign position ---
  \draw (3.2,5.6) -- (3.2,4.8);
  \node[anchor=south] at (3.2,5.62) {$D$};
  \node[anchor=west] at (3.25,5.15) {$w_D$};
  \draw (1.9,5.6) -- (1.9,4.8);
  \node[anchor=south] at (1.9,5.62) {$0$};
  \draw[line width=1pt] (1.9,4.8) -- (3.2,4.8);
  \draw[line width=1pt] (2.55,4.8) -- (2.55,3.6);
  \node[anchor=west] at (2.6,4.25) {$w_D{+}1$};

  % --- the subtractor: the only carry propagation in the loop ---
  \draw (-3.6,2.8) rectangle (3.5,3.6);
  \node at (-0.05,3.2) {$-$};

  % --- restore path: 2R'_i bypasses the subtractor entirely ---
  \draw[line width=1pt] (-2.7,4.45) -- (-5.6,4.45) -- (-5.6,1.6);
  \node[anchor=east] at (-5.65,3.0) {$w_D$};

  % --- the difference, low w_D bits ---
  \draw[line width=1pt] (-0.9,2.8) -- (-0.9,1.6);
  \node[anchor=east] at (-0.98,2.45) {$w_D$};

  % --- the sign bit: selects the mux and, inverted, is the quotient bit ---
  \draw (2.6,2.8) -- (2.6,1.3) -- (0.62,1.3);
  \node[anchor=west] at (2.65,2.55) {sign bit};
  \draw (2.6,2.2) -- (3.7,2.2);
  \draw (3.7,1.95) -- (3.7,2.45) -- (4.25,2.2) -- cycle;
  \draw (4.33,2.2) circle (0.08);
  \draw (4.41,2.2) -- (5.0,2.2) -- (5.0,1.0);
  \node[anchor=north] at (5.0,0.95) {$q_{w_X-1-i}$};

  % --- restoring multiplexer ---
  \draw (-6.2,1.6) -- (0.9,1.6) -- (0.5,0.9) -- (-5.8,0.9) -- cycle;
  \node at (-2.6,1.2) {\textsf{mux}};
  \node[anchor=east] at (-5.68,1.78) {$1$};
  \node[anchor=west] at (-0.82,1.78) {$0$};

  % --- output ---
  \draw[line width=1pt] (-2.6,0.9) -- (-2.6,0.15);
  \node[anchor=west] at (-2.55,0.5) {$w_D$};
  \node[anchor=north] at (-2.6,0.12) {$\lfloor R'_{i+1}\rfloor$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.4, p. 269.*

**Start from schoolbook and notice the shift is wrong for hardware.** Written directly, the paper-and-pencil algorithm is $R_0 = X$, $R_{i+1} = R_i - 2^{w_X-1-i}q_{w_X-1-i}D$ (9.8)–(9.10): each iteration subtracts $D$ shifted by a *different* amount. A datapath cannot afford an iteration-indexed barrel shift on $D$. The repair is a change of variable, $R_i = 2^{w_X-i}R'_i$ (p. 266), which is a pure rescaling and therefore changes no digit. Substituting and dividing both sides by $2^{w_X-i-1}$ turns the moving shift on $D$ into a fixed shift on the remainder:

$$R'_0 = 2^{-w_X}X, \qquad R'_{i+1} = 2R'_i - q_{w_X-1-i}D \tag{9.11, 9.13}$$

Every iteration is now literally the same circuit, and the multiplication by 2 is a wire.

**Read the digit off a sign bit instead of computing a quotient.** The general digit-recurrence selection rule $q = \lfloor \beta R_i / D\rfloor$ is itself a division. At $\beta = 2$ the floor collapses: $q \in \{0,1\}$, so the only question is whether $2R'_i \ge D$, and

$$q_{w_X-1-i} = \begin{cases} 1 & 2R'_i - D \ge 0\\ 0 & \text{otherwise}\end{cases} \tag{9.12}$$

is answered by the sign bit of one subtraction. The invariant $0 \le R'_i < D$ is what makes this a valid digit: from $0 \le R'_i < D$ we get $0 \le 2R'_i < 2D$, so the tested difference lies in $[-D, D)$; the positive branch keeps $2R'_i - D < D$ and the negative branch keeps $2R'_i < D$, so either way $0 \le R'_{i+1} < D$ and induction closes. The comparison is never built as a separate [[Magnitude Comparator]] — the subtractor already produces the comparison outcome in its MSB, and the difference is the value you wanted anyway.

**The restore is the mux, not a second add.** When the guess fails the correct next remainder is the *old* $2R'_i$, which is still sitting on a wire. So "restoring" costs a multiplexer, not the extra addition its historical name suggests — that second addition is what it cost on a register-starved processor with one accumulator (footnote 2, p. 267), and it is the cost [[Non-Restoring Division]] was invented to remove.

**Only $w_D+1$ bits ever enter the adder.** The full remainder word is $w_R = w_X + w_D$ bits, but the subtraction touches only the integer part of $R'_i$: the fractional bits of $R'_i$ are the bits of $X$ still queueing up, since $D$ has zeroes there. The subtractor is therefore $w_D + 1$ bits wide, the $+1$ being the sign position into which $D$ is zero-extended, and the mux is $w_D$ bits. The sign bit is then discarded rather than propagated — with $0 \le 2R'_i < 2D$ and $D$ sign-extended by a zero, whichever input the mux selects has a $0$ there, so $\lfloor R'_{i+1}\rfloor$ is again a $w_D$-bit unsigned number (p. 267). Widths in the diagram: $\lfloor R'_i\rfloor$ is $w_D$, $\lfloor 2R'_i\rfloor$ is $w_D+1$ after $x_{w_X-1-i}$ shifts in at the LSB, both subtractor operands are $w_D+1$, and both mux data inputs are $w_D$.

**One new bit of $X$ per iteration is "bring down the next digit".** Iteration $i$ consumes exactly $x_{w_X-1-i}$, the bit of weight $w_X-1-i$ — the binary case of considering one fresh decimal digit per step when $w_X > w_D$. In hardware $X$ and $Q$ share one shift register: $X$ leaves at the MSB end while $q$ enters at the LSB end, so the quotient costs no storage of its own. The recursion can also be continued past the integer digits to produce fractional quotient bits, by feeding zeroes once $w_X - 1 - i < 0$ (p. 268) — that is how a `ufix` quotient of arbitrary $\ell_Q$ is obtained, see [[Fixed-Point Representations]] for the format bookkeeping.

**Latency is $w_Q$ cycles and unrolling does not shorten it.** Each cycle is one full carry propagation across $w_D$ bits — a [[Ripple-Carry Adder]] in the simplest mapping — plus the sign bit plus the mux. Unrolling the loop in space concatenates these delays without overlapping them, because the mux of stage $i$ is controlled by the MSB of stage $i$'s subtraction, which is the *last* bit to arrive out of a carry chain. Unrolling therefore buys throughput via pipelining only, never latency (p. 267). Because the exact remainder $R = R'_{w_Q}$ falls out at the end, the quotient is correctly roundable at no extra cost, unlike any multiplicative divider — see [[Rounding]].

**On FPGAs the per-iteration cost is close to free.** The $w_D+1$-bit subtraction maps onto the hard carry chain, and the restore mux maps onto the same LUTs' F7/F8 or the adder's own input LUTs, so a radix-2 restoring iteration is roughly one LUT per bit of $D$ and nothing else. The catch is that the hard carry chain also makes a *wider* adder nearly free, which is exactly the argument for spending the slack on a higher radix instead — the book's conclusion is that high-radix dividers map better still to modern FPGAs (footnote 2, p. 267). On ASIC, where the adder can be a fast-carry structure, the fixed sign-bit-then-mux tail is the part that stops shrinking.

**Worked example, $181 \div 13$ on 8 bits.** $X = 10110101_2$, $D = 1101_2$, so $R'_0 = 0.10110101_2$ and each step tests $2R'_i - D$:

| $i$ | $2R'_i$ | $2R'_i - D$ | sign | $q_{7-i}$ | $R'_{i+1}$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $1.0110101$ | $-1011.1001011$ | $-$ | 0 | $1.0110101$ |
| 1 | $10.110101$ | $-1010.001011$ | $-$ | 0 | $10.110101$ |
| 2 | $101.10101$ | $-111.01011$ | $-$ | 0 | $101.10101$ |
| 3 | $1011.0101$ | $-1.1011$ | $-$ | 0 | $1011.0101$ |
| 4 | $10110.101$ | $1001.101$ | $+$ | **1** | $1001.101$ |
| 5 | $10011.01$ | $110.01$ | $+$ | **1** | $110.01$ |
| 6 | $1100.1$ | $-0.1$ | $-$ | 0 | $1100.1$ |
| 7 | $11001$ | $1100$ | $+$ | **1** | $1100$ |

$Q = 00001101_2 = 13$ and $R = R'_8 = 1100_2 = 12$, exact — error $0$ ulp. Note the shape of the work: on four of the eight cycles the subtractor's output was computed and thrown away, and the old $R'$ came back through the mux. The subtractor runs every cycle regardless; only its result is conditional.

$$\boxed{\ R'_{i+1} = 2R'_i - q_{w_X-1-i}D,\qquad q_{w_X-1-i} = \overline{\operatorname{sign}(2R'_i - D)},\qquad 0 \le R'_i < D\ }$$

**When it breaks.**

- $D = 0$ has no defined behaviour; nothing in the recurrence detects it, so the divide-by-zero check is external.
- Latency $w_Q$ is linear in precision, so a double-precision significand costs ~56 cycles. Past roughly 16 bits this is where SRT (a higher radix, fewer iterations) or a multiplicative method takes over — see [[Choosing a Divider]].
- The critical path per cycle is subtract $\rightarrow$ MSB $\rightarrow$ mux, and the mux sits *after* the slowest bit of the adder. No adder speedup removes that tail, which is why redundancy, not faster addition, is the next move.
- Un-normalized $D$ makes $w_R = w_X + w_D$ grow with both operands, and the digit is still correct — but the quotient can then need $w_X$ bits (worst case $D = 1$), so there is no cheap early exit.
- A carry-save partial remainder cannot be dropped in directly: the sign of a redundant number is not its MSB, which is precisely what [[Carry-Save Partial Remainder]] has to work around.

**RTL (Spade).** One iteration, both as the combinational cell of the diagram and as the clocked loop body:

```spade
/// One restoring-division step: the subtractor, its sign bit, and the restore mux.
fn restoring_step<#uint W>(r: uint<W>, d: uint<W>, xbit: bool) -> (uint<W>, bool) {
    let sr: uint<{W + 1}> = r.concat(xbit.as_uint());          // 2R'_i, w_D+1 bits
    let diff: int<{W + 3}> = sr.to_int() - zext::<W, {W + 1}>(d).to_int();
    let q = diff >= 0;                                          // the inverted sign bit
    let rnext: uint<W> = if q { trunc(diff.as_uint()) } else { trunc(sr) };
    (rnext, q)
}

/// The loop: one iteration per clock cycle, X leaving the MSB end of the
/// shift register as Q enters at the LSB end.
entity restoring_iter<#uint W>(clk: clock, load: bool, x: uint<W>, d: uint<W>)
    -> (uint<W>, uint<W>)
{
    reg(clk) (rem, xq): (uint<W>, uint<W>) reset(load: (0, x)) = {
        let (rn, q) = restoring_step(rem, d, xq.msb());
        (rn, trunc(xq.concat(q.as_uint())))
    };
    (rem, xq)
}
```

`rem` is $\lfloor R'_i\rfloor$, the $w_D$-bit bus entering the diagram top-left; `xq` is the shared $X$/$Q$ register, so `xq.msb()` is the wire labelled $x_{w_X-1-i}$ and the `concat` at the bottom is $q$ shifting in. `sr` is $\lfloor 2R'_i\rfloor$ at $W+1$ bits; the subtraction is done in `int` because Spade's `-` on `uint` cannot represent the negative branch, and the extra bit `int<{W+3}>` is Spade's widening, not hardware — synthesis keeps $W+2$. The whole entity is one iteration: an operator needs $W$ cycles per division, and the loop control is a `load` mux on the two registers plus a $\lceil\log_2 W\rceil$-bit down-counter for `done`, which is not shown because it is not on the critical path.

`restoring_iter::<8>` was simulated against `$random` operands: 3008 vectors, including $181/13$, $35/7$, $1/128$ and $128/1$, all matching `x / d` and `x % d` exactly.

**Related Notes.**

- [[Non-Restoring Division]] – extends: deletes the restore mux by letting $R'$ go negative, paying one correction iteration.
- [[SRT Division]] – extends: buys a cheap selection function with redundancy instead of an exact sign test, so the digit no longer waits on the full carry chain.
- [[Ripple-Carry Adder]] – depends-on: the $w_D+1$-bit subtractor whose carry propagation *is* the cycle time.
- [[Magnitude Comparator]] – compares: the $2R'_i \ge D$ test done as a dedicated comparator, which this circuit gets free as the subtractor's MSB.
- [[Carry-Save Partial Remainder]] – counter-example: removes the carry propagation, but breaks the sign test this note's digit selection rests on.
- [[Choosing a Divider]] – compares: where linear latency and minimal area stop being the right trade.
- [[Fixed-Point Representations]] – supports: the $w_R = w_X + w_D$ alignment and the format of the quotient's fractional digits.
- [[Rounding]] – supports: why an exact $R'_{w_Q}$ hands you the rounding decision at no cost.
- [[Dividers]] – compares: the full family this is the base case of.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.1 schoolbook binary division, (9.8)–(9.13), Fig. 9.2 (p. 266), Fig. 9.3 (p. 268), Fig. 9.4 (p. 269); word sizes, sign-bit discard and latency argument, p. 267; fractional quotient digits, p. 268; non-restoring footnote 2, p. 267.
- §9.2.2 general radix-$\beta$ recurrence and the selection rule (9.25) this specialises, pp. 269–271.
