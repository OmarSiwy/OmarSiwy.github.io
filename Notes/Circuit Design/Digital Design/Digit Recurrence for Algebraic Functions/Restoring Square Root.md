---
title: Restoring Square Root
description: "One digit per cycle from a trial subtraction and its sign, undone when negative; cheapest possible selection, at the price of a restore mux in the loop."
kind: circuit
source: "ASA §19.1.2-19.1.3, pp. 575-578"
status: seed
spade: simulated
tags: [digital, square-root, digit-recurrence, restoring, iterative]
aliases:
  - Simple Binary Restoring Square Root
  - Binary Restoring Square Root
  - Restoring Square Rooter
  - Restoring Square Root Recurrence
---

# Restoring Square Root

The radix-2 square-root digit recurrence that assumes the next digit is 1, performs the subtraction, and undoes it through a multiplexer when the sign says otherwise — the only square root whose per-iteration hardware is one subtracter and one mux, with no digit-selection logic at all.

```tikz title="One step of a restoring square root: subtracter, sign bit, restore multiplexer"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- left input: the scaled remainder, doubled by wiring ---
  \draw[line width=1pt] (-2.7,6.0) -- (-2.7,3.7);
  \node[anchor=south] at (-2.7,6.02) {$2W_i$ --- a wire, not an adder};
  \node[anchor=east] at (-2.8,5.0) {$i{+}3$ bits};

  % --- right input: the subtrahend, formed by concatenation ---
  \draw[line width=1pt] (2.55,6.0) -- (2.55,5.45);
  \node[anchor=south] at (2.55,6.02) {$2S_i$, \texttt{ufix(1,$-i{+}1$)}};
  \draw (1.15,4.65) rectangle (3.95,5.45);
  \node at (2.55,5.05) {append $01_2$};
  \draw[line width=1pt] (2.55,4.65) -- (2.55,3.7);
  \node[anchor=east,align=right] at (2.45,4.15) {$2S_i{+}2^{-i-1}$\\ \texttt{ufix(1,$-i{-}1$)}, $i{+}3$ bits};

  % --- the subtracter: the whole carry propagation of the iteration ---
  \draw (-4.2,2.9) rectangle (3.6,3.7);
  \node at (-3.7,3.3) {$+$};
  \node at (3.1,3.3) {$-$};
  \node at (-0.3,3.3) {subtracter, $i{+}3$ bits};

  % --- restore path: 2W_i bypasses the subtracter entirely ---
  \draw[line width=1pt] (-2.7,4.6) -- (-5.6,4.6) -- (-5.6,1.6);
  \filldraw (-2.7,4.6) circle (1.6pt);
  \node[anchor=east] at (-5.7,3.1) {$i{+}3$};

  % --- tentative remainder ---
  \draw[line width=1pt] (-0.9,2.9) -- (-0.9,1.6);
  \node[anchor=east] at (-1.0,2.15) {$T_{i+1}$, \texttt{sfix(1,$-i{-}1$)}};

  % --- the sign bit: mux select, and inverted, the digit ---
  \draw (-0.9,2.55) -- (2.9,2.55) -- (2.9,1.3) -- (0.62,1.3);
  \filldraw (-0.9,2.55) circle (1.6pt);
  \filldraw (2.9,2.55) circle (1.6pt);
  \node[anchor=north] at (1.6,2.48) {sign bit};
  \draw (2.9,2.55) -- (4.05,2.55);
  \draw (4.05,2.3) -- (4.05,2.8) -- (4.6,2.55) -- cycle;
  \draw (4.68,2.55) circle (0.08);
  \draw (4.76,2.55) -- (5.4,2.55) -- (5.4,1.0);
  \node[anchor=north] at (5.4,0.95) {$d_{-i-1}$};

  % --- restoring multiplexer ---
  \draw (-6.2,1.6) -- (0.9,1.6) -- (0.5,0.9) -- (-5.8,0.9) -- cycle;
  \node at (-2.6,1.22) {\textsf{mux}};
  \node[anchor=east] at (-5.68,1.78) {$1$};
  \node[anchor=west] at (-0.82,1.78) {$0$};

  % --- output ---
  \draw[line width=1pt] (-2.6,0.9) -- (-2.6,0.15);
  \node[anchor=west] at (-2.5,0.5) {$i{+}3$};
  \node[anchor=north] at (-2.6,0.12) {$W_{i+1}$};

  % --- what is not drawn ---
  \node[anchor=north west,align=left,text width=6.0cm] at (5.9,6.1)
    {Bits of $2W_i$ below position $-i{-}1$ never reach the subtracter: they are
     copied straight through to $W_{i+1}$, and recursively from $W_0 = M-1$.
     That is why the operand width is $i{+}3$ and not the full $n{+}2$.};
  \node[anchor=north west,align=left,text width=6.0cm] at (5.9,2.9)
    {$S_{i+1}=S_i+2^{-i-1}d_{-i-1}$ is not drawn because it is a
     concatenation --- $d_{-i-1}$ is appended to the $\texttt{ufix(0,}-i\texttt{)}$
     register holding $S_i$. No adder, no mux.};
\end{circuitikz}
\end{document}
```

*after Fig. 19.2, p. 577.*

**Measure progress through the defining polynomial, because the error itself is not computable.** The obvious accuracy measure for the partial result $S_i = \sum_{j=0}^{i}2^{-j}d_{-j}$ is $S_i - \sqrt M$, and it is unavailable: $\sqrt M$ is the thing being computed. Substitute $S_i^2 - M$ instead. That quantity is a polynomial in known values, hence exactly computable in fixed point, and it vanishes exactly when the error does. The substitution is legal precisely because the square root is an *algebraic* function — defined implicitly by $S^2 - M = 0$ — and it is the move the whole family of digit recurrences is built on.

**Scale the remainder so one bound serves every iteration.** Start from the integer case, which fixes the constant: an integer square root is $N = S^2 + R$ with the unicity condition $S^2 \le N < (S+1)^2$, i.e. $0 \le R < 2S+1$. Moving to a fixed-point ulp of $2^{-i}$ replaces the $+1$ by $+2^{-i}$: $S_i^2 \le M < (S_i + 2^{-i})^2$, and expanding the square gives $0 \le M - S_i^2 < 2\cdot 2^{-i}S_i + 2^{-2i}$. Multiplying through by $2^{i}$ removes the iteration index from the leading term and defines the **scaled remainder**

$$W_i = 2^{i}\left(M - S_i^2\right),\qquad\text{invariant}\qquad 0 \le W_i < 2S_i + 2^{-i}$$

The invariant is what the algorithm actually enforces; "correct digit" means nothing more than "keeps $W$ inside this interval". Because $W_i \ge 0$ is the left edge, the raw result is a round-**down** of $\sqrt M$ to $n$ digits, so the error is one-sided and under 1 ulp — see [[Error Accuracy]].

**Expand the square once and the recurrence falls out.** Substitute $S_{i+1} = S_i + 2^{-i-1}d_{-i-1}$ into the definition of $W_{i+1}$ and expand by the binomial identity $(a+b)^2 = a^2 + 2ab + b^2$:

$$\left(S_i + 2^{-i-1}d_{-i-1}\right)^2 = S_i^2 + 2\cdot 2^{-i-1}d_{-i-1}S_i + 2^{-2i-2}d_{-i-1}^2$$

Distributing $2^{i+1}$ over the three terms of $W_{i+1} = 2^{i+1}(M - S_{i+1}^2)$ gives the general form $W_{i+1} = 2W_i - 2d_{-i-1}S_i - 2^{-i-1}d^2_{-i-1}$. The multiplicand of the cross term is $S_i$, the result *being built* — unlike [[Restoring Division]], where the multiplicand is the constant divisor. That is the structural reason square-root digit selection is harder in general; at radix 2 it is also the reason the answer is a lucky accident rather than a design.

**At $\beta=2$ selection collapses into a sign test, because there are only two candidates.** With $d_{-i-1}\in\{0,1\}$ the term $d^2$ equals $d$, so the two candidate remainders are $2W_i$ (digit 0) and $2W_i - (2S_i + 2^{-i-1})$ (digit 1). Try the larger digit; if the result is negative the invariant $W\ge0$ is violated and the digit was really 0, so discard the subtraction and keep $2W_i$. Writing $T_{i+1}$ for the tentative remainder,

$$T_{i+1} = 2W_i - \left(2S_i + 2^{-i-1}\right),\qquad
d_{-i-1} = \begin{cases}1 & T_{i+1}\ge0\\ 0 & T_{i+1}<0\end{cases},\qquad
W_{i+1} = \begin{cases}T_{i+1} & T_{i+1}\ge0\\ 2W_i & T_{i+1}<0\end{cases}$$

No comparator is built: the subtracter already produces the comparison in its sign bit, and produces the value you wanted in the same operation. "Restoring" names the mux, not a second addition — the un-subtracted $2W_i$ is still on a wire. The historical name comes from a machine with one accumulator, where undoing the subtraction really did cost an add.

**Both "additions" in the algorithm are concatenations, which is why only one adder exists.** $S_i$ lives in `ufix(0,-i)` ($i+1$ bits, value in $[1,2)$), so $S_{i+1} = S_i + 2^{-i-1}d_{-i-1}$ appends one bit to the right of the register — no adder, no carry. Likewise $2S_i$ is `ufix(1,-i+1)`, so $2S_i + 2^{-i-1}$ is obtained by appending the two bits $01_2$ to the right of $2S_i$, yielding a `ufix(1,-i-1)` number. Both are format observations, not arithmetic; see [[Number Formats]] for the notation. And $2W_i$ is a shift, i.e. wiring. The full per-iteration hardware is therefore one subtracter, one inverter and one mux.

**The subtracter is $i+3$ bits, not full width, because the low end of the remainder is inert.** $T_{i+1}$ is `sfix(1,-i-1)`, and the subtrahend has no bits below position $-i-1$. Every bit of $2W_i$ below that position is therefore copied unchanged into $W_{i+1}$, and recursively from $W_0 = M-1$ — those bits are the digits of $M$ still queueing up, exactly as paper-and-pencil division brings down one dividend digit per step. Unrolled in space, iteration $i$ needs a subtracter on only $i+3$ bits, so the early stages are narrow and fast and the array is triangular rather than rectangular. Rolled into a loop this saving disappears: the one physical subtracter must be sized for the last iteration, $n+2$ bits.

**Initialisation is free, and rounding to nearest costs one extra iteration rather than a second pass.** [[Square Root Range Reduction]] delivers $M \in [1,4)$, so $\sqrt M \in [1,2)$ and the leading digit is known without computing anything: $d_0 = 1$, $S_0 = 1$, $W_0 = M - 1$. For a target precision $\ell$ there is no need for the recentred bound $-S_i \le W_i < S_i + 2^{-i-1}$; run $n = -\ell + 1$ iterations and use the extra digit $d_{-n}$ directly as the round bit, $S_{n-1} + 2^{\ell}d_{-n}$. That implements round-to-nearest-ties-up, and the tie case is unreachable in practice because a square root is irrational unless $M$ is a perfect square — [[Rounding]].

**A four-iteration trace, $M = 1.11_2 = 1.75$.** Two of the four steps restore:

| $i$ | $2W_i$ | $2S_i + 2^{-i-1}$ | $T_{i+1}$ | $d_{-i-1}$ | $W_{i+1}$ | $S_{i+1}$ |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | $1.5$ | $2.5$ | $-1.0$ | 0 | $1.5$ | $1.0$ |
| 1 | $3.0$ | $2.25$ | $0.75$ | **1** | $0.75$ | $1.01_2$ |
| 2 | $1.5$ | $2.625$ | $-1.125$ | 0 | $1.5$ | $1.010_2$ |
| 3 | $3.0$ | $2.5625$ | $0.4375$ | **1** | $0.4375$ | $1.0101_2$ |

$S_4 = 1.0101_2 = 1.3125$, and $\sqrt{1.75} = 1.32287\ldots$, so the result is the round-down to four fractional bits. The remainder checks out exactly: $2^4(1.75 - 1.3125^2) = 0.4375 = W_4$. Note the shape of the work — on half the cycles the subtracter ran and its output was thrown away. The subtracter runs unconditionally; only its result is conditional.

$$\boxed{\;T_{i+1} = 2W_i - \left(2S_i + 2^{-i-1}\right),\qquad d_{-i-1} = \overline{\operatorname{sign}(T_{i+1})},\qquad W_{i+1} = d_{-i-1}\,?\,T_{i+1} : 2W_i,\qquad 0 \le W_i < 2S_i + 2^{-i}\;}$$

**When it breaks.**

- $M$ outside $[1,4)$ invalidates the free $d_0 = 1$ immediately, and $M < 1$ makes $W_0 = M-1$ negative, breaking the invariant on iteration zero. The even-exponent range reduction is not an optimisation here, it is a precondition.
- Latency is $n$ cycles, linear in precision: about 25 for a binary32 significand, 54 for binary64. That is where a higher radix ([[SRT Square Root]]) or a multiplicative method takes over — [[Choosing a Digit Recurrence]].
- The critical path is subtract $\rightarrow$ sign bit $\rightarrow$ mux, and the mux sits *after* the slowest bit of the carry chain. Speeding up the adder never removes that tail; redundancy does, which is the whole motivation for the carry-save residual.
- A carry-save remainder cannot simply be substituted: the sign of a redundant number is not its MSB, and the sign is exactly what this digit rule reads. Recovering it needs a genuine selection function over a truncated remainder — [[Square Root Digit Selection Function]].
- On current FPGAs restoring loses outright: the book's authors measure [[Non-Restoring Square Root]] as both smaller and shorter-path on LUT-plus-fast-carry fabric, which is why it, and not this, is the [[FloPoCo]] default. Restoring survives as `flopoco FPSqrt method=0 wE=8 wF=23`.

**RTL (Spade).** One iteration, first as the combinational cell of the diagram, then wrapped in the register that makes it a loop. The recurrence is written in its integer scaling — multiply $T_{i+1} = 2W_i - (2S_i + 2^{-i-1})$ through by $2^{i+1}$ and it becomes $4R_i - (4s_i + 1)$ with $R_i = 4^iM - s_i^2$ and $s_i = 2^iS_i$, so every quantity is an integer and the two new bits of $M$ shift in at the bottom:

```spade
/// One restoring square-root iteration, integer-scaled:
/// R_{i+1} = 4 R_i + m2 - d(4 s_i + 1),  s_{i+1} = 2 s_i + d.
fn restoring_sqrt_step<#uint W>(rem: uint<{W + 2}>, root: uint<W>, m2: uint<2>)
    -> (uint<{W + 2}>, uint<W>, bool)
{
    let shifted: uint<{W + 2}> = trunc(rem.concat(m2));  // 4 R_i, two new bits of M
    let one: uint<2> = 0b01;
    let sub: uint<{W + 2}> = root.concat(one);           // 4 s_i + 1, a concatenation
    let t = shifted.to_int() - sub.to_int();             // T_{i+1}
    let d = t >= 0;                                      // the inverted sign bit
    let rnext: uint<{W + 2}> = if d { trunc(t.as_uint()) } else { shifted };
    (rnext, trunc(root.concat(d.as_uint())), d)
}

/// The loop body: one digit per clock cycle.
entity restoring_sqrt_iter<#uint W>(clk: clock, load: bool, m2: uint<2>)
    -> (uint<W>, uint<{W + 2}>)
{
    reg(clk) (rem, root): (uint<{W + 2}>, uint<W>) reset(load: (0, 0)) = {
        let (rn, sn, _) = restoring_sqrt_step::<W>(rem, root, m2);
        (rn, sn)
    };
    (root, rem)
}
```

`shifted` is the $2W_i$ bus of the diagram (doubled twice, because the integer scaling advances by $4$ per digit), `sub` is the $2S_i + 2^{-i-1}$ bus and is built by `concat`, never by an adder; `t >= 0` *is* the sign bit and the mux select, and the `if` is the restore mux. Widths: the subtraction is done in `int` because the negative branch has to exist, and Spade's widening makes `t` two bits wider than the datapath — synthesis keeps $W+2$. The entity is **one iteration**: a $W$-digit root costs $W$ cycles plus one load cycle, and the loop control is the `load` mux on the two registers, a $\lceil\log_2 W\rceil$-bit down-counter for `done`, and a $2W$-bit input shift register feeding `m2` two bits at a time — none of it on the critical path, which stays subtract $\rightarrow$ sign $\rightarrow$ mux. Unlike the drawing, synthesis sizes the one subtracter for the last iteration rather than for iteration $i$.

`restoring_sqrt_step::<8>` was checked against a behavioural $\lfloor\sqrt{N}\rfloor$ reference on both forms: 4018 vectors through an unrolled 8-digit instance (18 named, including $0$, $257 = 0000\,0001\,0000\,0001_2$, $128$, $65025 = 255^2$ and $65535$, plus 4000 `$random`) and 306 vectors through the clocked `restoring_sqrt_iter::<8>` driven one digit per cycle. Root and remainder matched exactly every time.

**Related Notes.**

- [[Non-Restoring Square Root]] – extends: keeps $T_i$ as the state instead of $W_i$, folding the restore into the next iteration's sign and deleting the mux.
- [[Restoring Division]] – compares: the same subtracter-sign-mux cell, but with a *constant* multiplicand, which is what makes higher radices easy there and hard here.
- [[SRT Square Root]] – extends: a redundant digit set and a carry-save residual, so the digit no longer waits for the full carry propagation.
- [[Square Root Digit Selection Function]] – depends-on: what the sign test degenerates from, and what it must be replaced by once the remainder is redundant.
- [[Square Root Range Reduction]] – depends-on: supplies $M \in [1,4)$, without which $d_0 = 1$ and $W_0 = M-1$ are both invalid.
- [[RCA, Ripple-Carry Adder]] – depends-on: the $i+3$-bit subtracter whose carry propagation is the cycle time.
- [[Rounding]] – supports: why one extra digit, not a second pass, buys round-to-nearest.
- [[Number Formats]] – supports: the `ufix`/`sfix` bookkeeping that turns two of the three additions into concatenations.
- [[FloPoCo]] – supports: generates this operator as `FPSqrt method=0`, with non-restoring as the default.
- [[Square Root]] – compares: the full set of ways to get a root, of which this is the cheapest per gate and the slowest per bit.
- [[Choosing a Digit Recurrence]] – compares: where linear latency and minimal area stop being the right trade.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 19, "Digit Recurrence for Algebraic Functions".

- §19.1.2 generic radix-$\beta$ formulation, integer-square-root unicity condition, scaled remainder (19.5)–(19.7) and the recurrence (19.8)–(19.10), pp. 575–576.
- §19.1.3 simple binary restoring square root, (19.11)–(19.17) and Fig. 19.2, p. 577; the `ufix(0,-i)`/`ufix(1,-i-1)` concatenation argument and the round-bit trick, p. 577; the $i+3$-bit subtracter and the FloPoCo `method=0` command, p. 578.
- §19.1.4 the FPGA measurement that makes non-restoring the default, p. 580.
- Table 19.1 notation, p. 574.
