---
title: "Non-Restoring Square Root"
description: "Keeps the tentative remainder as state so the digit is the inverted sign bit; one inverter plus one add/sub of i+4 bits, the FloPoCo default on FPGAs."
kind: circuit
source: "ASA §19.1.4, pp. 578-580"
status: seed
spade: simulated
tags: [digital, digit-recurrence-for-algebraic-functions, sqrt, fpga]
aliases:
  - Binary Non-restoring Square Root
  - Non-restoring Square Root
  - Non-Restoring Square Rooter
---

# Non-Restoring Square Root

A radix-2 digit-recurrence square root that carries the *tentative* remainder $T_i$ as state rather than the true remainder $W_i$, so that no restore mux is ever needed and the result digit is literally the inverted sign bit of the register.

```tikz title="One iteration of the binary non-restoring square root: sign-bit inverter, two concatenation blocks and a single add/subtract"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------------- inputs ----------------
  \node[anchor=south] at (0,4.5) {$T_i$};
  \node[anchor=south] at (5.4,4.5) {$S_{i-1}$};
  \draw[->] (0,4.45) -- (0,-1.0);
  \node[anchor=west,font=\footnotesize] at (0.15,4.05) {\texttt{sfix(2,-n)}, $n{+}3$ bits};
  \draw[->] (5.4,4.45) -- (5.4,3.0);
  \node[anchor=west,font=\footnotesize] at (5.55,4.05) {\texttt{ufix(0,-i+1)}, $i$ bits};

  % ---------------- sign tap + inverter ----------------
  \filldraw (0,3.3) circle (1.6pt);
  \draw (0,3.3) -- (-1.55,3.3);
  \node[anchor=south,font=\footnotesize] at (-0.75,3.36) {sign bit};
  \draw (-1.55,3.0) -- (-1.55,3.6) -- (-2.15,3.3) -- cycle;
  \draw (-2.27,3.3) circle (0.12);
  \draw[->] (-2.39,3.3) -- (-3.55,3.3);
  \node[anchor=east] at (-3.6,3.3) {$d_{-i}$};
  \node[anchor=north east,font=\footnotesize] at (-3.6,3.15) {1 bit};

  % ---------------- digit fan-out ----------------
  \filldraw (-3.0,3.3) circle (1.6pt);
  \draw (-3.0,3.3) -- (-3.0,-1.3) -- (-2.0,-1.3);
  \node[anchor=west,font=\footnotesize] at (-2.9,0.9) {$\pm$ control};
  \draw (-3.0,3.3) -- (-3.0,5.15) -- (3.3,5.15) -- (3.3,0.9);
  \draw[->] (3.3,2.7) -- (4.2,2.7);
  \filldraw (3.3,2.7) circle (1.6pt);
  \draw[->] (3.3,0.9) -- (4.2,0.9);
  \node[anchor=south,font=\footnotesize] at (0.15,5.2)
    {the digit steers both concatenations and the sign of the add/sub};

  % ---------------- S concatenation chain ----------------
  \draw (4.2,2.4) rectangle (8.0,3.0);
  \node[font=\footnotesize] at (6.1,2.7) {append $d_{-i}$ --- wiring};
  \draw[->] (5.4,2.4) -- (5.4,1.4);
  \node[anchor=west,font=\footnotesize] at (5.55,1.95) {$S_i$, \texttt{ufix(0,-i)}, $i{+}1$ bits};
  \filldraw (5.4,1.6) circle (1.6pt);
  \draw[->] (5.4,1.6) -- (10.4,1.6) -- (10.4,-2.1);
  \node[anchor=south east] at (10.35,-2.1) {$S_i$};

  \draw (4.2,0.4) rectangle (8.0,1.4);
  \node[font=\footnotesize,align=center] at (6.1,0.9)
    {$\times 2$, then append\\$2^{-i}\overline{d_{-i}}$ and $2^{-i-1}$};
  \draw[->] (5.4,0.4) -- (5.4,-1.0);
  \node[anchor=west,font=\footnotesize,align=left] at (5.55,-0.15)
    {$U_i = 2S_i + 2^{-i}\overline{d_{-i}} + 2^{-i-1}$\\\texttt{ufix(1,-i-1)}, $i{+}3$ bits};

  % ---------------- 2 T_i ----------------
  \node[anchor=west,font=\footnotesize] at (0.15,0.3) {$2T_i$ --- hard-wired shift};

  % ---------------- add/sub ----------------
  \draw[fill=black!8] (-2.0,-1.6) rectangle (7.6,-1.0);
  \node at (2.6,-1.3) {add\,/\,sub};
  \node[anchor=west,font=\footnotesize] at (-1.9,-1.3) {$\pm$};
  \node[anchor=east,font=\footnotesize] at (7.5,-1.3) {$+$};

  \draw[->] (2.6,-1.6) -- (2.6,-2.75);
  \node[anchor=west,font=\footnotesize] at (2.75,-2.15)
    {$T_{i+1} = 2T_i \mp U_i$, \texttt{sfix(2,-n)}};
  \node[anchor=north] at (2.6,-2.8) {$T_{i+1}$};

  \node[anchor=north west,align=left,text width=13.8cm,font=\footnotesize] at (-3.8,-3.6)
    {$U_i$ occupies positions $1$ down to $-i-1$, so the add/sub only has to compute
     indices $-i-1\ldots 2$ --- $i+4$ bits at step $i$, one more than the restoring
     version because the sign must be carried. Every bit of $2T_i$ below $-i-1$ is
     copied through unchanged, and recursively comes straight from $M-1$.};
\end{circuitikz}
\end{document}
```

*after Fig. 19.3, p. 579.*

**Change what the register holds, and the restore disappears.** [[Restoring Square Root]] computes a trial value $T_{i+1} = 2W_i - (2S_i + 2^{-i-1})$, tests its sign, and writes back either $T_{i+1}$ or the unmodified $2W_i$. The write-back mux is the waste: it sits between the adder output and the register input, on the critical path, and it exists only to undo an operation that has already been paid for. Keep $T_i$ itself as the state instead of $W_i$ and the undo can be deferred — the algebra of the *next* iteration absorbs it, because addition is associative and the restore is just an addend that has not been applied yet.

**Both cases collapse into one addend, and this is why the circuit is one inverter.** The recurrence must be rewritten as a function of $T_i$, which forks on what happened last time. If $T_i \ge 0$ then $d_{-i}=1$ and no restore was pending, so $W_i = T_i$ and substituting into the restoring recurrence gives directly

$$T_{i+1} = 2T_i - \left(2S_i + 2^{-i-1}\right)$$

If $T_i < 0$ then $d_{-i}=0$ and the pending restore is $W_i = T_i + 2S_{i-1} + 2^{-i}$. Substituting that, and using $S_i = S_{i-1}$ because the digit was zero,

$$T_{i+1} = 2\left(T_i + 2S_{i-1} + 2^{-i}\right) - 2S_i - 2^{-i-1} = 2T_i + \left(2S_i + 2^{-i+1} - 2^{-i-1}\right)$$

and by collecting powers, $2^{-i+1} - 2^{-i-1} = 3\cdot 2^{-i-1}$, the two-bit pattern $11_2$ starting at position $-i-1$. The first case appended $01_2$ at the same position. So the single expression $2^{-i}\overline{d_{-i}} + 2^{-i-1}$ covers both — $d=1$ selects $01_2$, $d=0$ selects $11_2$ — and the *only* thing the digit changes is that one bit and the sign of the operation. Because $d_{-i}$ is by construction the negation of the sign bit of $T_i$, the entire digit-selection logic of this circuit is a single inverter, and there is no separate comparator, no P-D diagram, and no lookup table.

**Every "addition" other than the add/sub is wiring.** $S_i = S_{i-1} + 2^{-i}d_{-i}$ looks like an adder but $S_{i-1}$ lives in `ufix(0,-i+1)` — $i$ bits, all positions above $-i$ already occupied, position $-i$ guaranteed zero — so the sum is bit concatenation into `ufix(0,-i)`, $i{+}1$ bits. Likewise $2S_i$ is `ufix(1,-i+1)` by a hard-wired left shift, and appending the two bits of $2^{-i}\overline{d_{-i}} + 2^{-i-1}$ below it yields $U_i$ in `ufix(1,-i-1)`, $i{+}3$ bits, again with no carry. This is exactly the [[Number Formats]] observation that an addition whose operands have disjoint nonzero positions is a concatenation; it is what keeps a square root free of any multiplier or second adder.

**The add/subtract is $i+4$ bits at step $i$, and that is one bit worse than restoring.** $U_i$ spans positions $1$ down to $-i-1$, so the effective operation on $2T_i$ touches indices $-i-1$ up to $2$; everything below $-i-1$ is copied unchanged out of $2T_i$ and, by unrolling the recurrence, comes straight from the initial $T_0 = M - 1$. That is $i+4$ bits, against $i+3$ for the restoring version — the extra bit is the sign, which the restoring formulation could discard after its test but which this one has to carry into the next iteration. Unrolled in space the operator is a triangle of widening adders: the early steps are narrow and fast, the last one is the full $n{+}4$ bits, exactly like paper-and-pencil division consuming one dividend digit per step. Folded in time, all $n{+}1$ steps share one $n{+}4$-bit add/subtract and the width saving is lost — it buys area only when unrolled or when each pipeline stage is sized individually.

**Trace $\sqrt2$ and the mechanism is visible in the sign column.** Take $M=2$, $n=7$, $S_{-1}=0$, $T_0 = M-1 = 1$, with $T$ held in `sfix(2,-7)`, 10 bits.

| $i$ | $T_i$ | $d_{-i}$ | $S_i$ | $U_i$ | $T_{i+1}=2T_i \mp U_i$ |
| --- | --- | --- | --- | --- | --- |
| 0 | $+1$ | **1** | `1.` | `10.1` | $2(1)-2.5 = -0.5$ |
| 1 | $-0.5$ | **0** | `1.0` | `10.11` | $2(-0.5)+2.75 = +1.75$ |
| 2 | $+1.75$ | **1** | `1.01` | `10.101` | $2(1.75)-2.625 = +0.875$ |
| 3 | $+0.875$ | **1** | `1.011` | `10.1101` | $2(0.875)-2.8125 = -1.0625$ |
| 4 | $-1.0625$ | **0** | `1.0110` | `10.11011` | $2(-1.0625)+2.84375 = +0.71875$ |
| 5 | $+0.71875$ | **1** | `1.01101` | `10.110101` | $2(0.71875)-2.828125 = -1.390625$ |
| 6 | $-1.390625$ | **0** | `1.011010` | `10.1101011` | $2(-1.390625)+2.8359375 = +0.0546875$ |
| 7 | $+0.0546875$ | **1** | `1.0110101` | — | — |

The digit column read downward is $1,0,1,1,0,1,0,1$, so $S_7 = 1.0110101_2 = 1.4140625$, and $\sqrt2 = 1.0110101000001\ldots_2$ — all seven digits correct. The residual runs negative at $i=1,4,6$ and is never repaired; the following iteration's *addition* repairs it, which is the entire content of "non-restoring". The error is $(\sqrt2 - S_7)/2^{-7} = 0.019$ ulp and is positive by construction: the raw recurrence rounds **down**, error in $[0,1)$ ulp ([[Error Accuracy]]). Round-to-nearest costs exactly one extra iteration and no extra hardware — target $\ell = -6$ and use $d_{-7}$ as the round bit, $S_6 + 2^{-6}d_{-7} = 1.421875$, which is the correctly rounded value at 6 fractional bits with error $0.49$ ulp.

**On FPGAs this beats the restoring form, which is not the ASIC intuition.** The restoring version has a narrower adder and its mux is cheap in an ASIC standard-cell library, so on paper it should win. The book reports the opposite on current devices: the non-restoring formulation maps better onto the [[Lookup-Tables]] and the fast-carry structure, giving both lower area and a shorter critical path, and it is the current default in [[FloPoCo]] — `flopoco FPSqrt wE=8 wF=23` emits this algorithm, and `method=0` is needed to get the restoring one back. The reason is structural: the add/subtract is a single [[RCA, Ripple-Carry Adder]] on the hardened carry chain, where the carry is nearly free, while the restoring mux would consume a whole LUT per bit in front of the register and cannot ride the carry chain at all. On an ASIC the trade-off is much closer, and the extra sign bit is a real cost.

$$\boxed{\ d_{-i} = \overline{\operatorname{sign}(T_i)},\qquad U_i = 2S_i + 2^{-i}\overline{d_{-i}} + 2^{-i-1},\qquad T_{i+1} = 2T_i + (-1)^{d_{-i}} U_i\ }$$

with $S_{-1}=0$, $T_0 = M-1$, and $M \in [1,4)$ from [[Square Root Range Reduction]].

**When it breaks.**

- **$M$ must already be in $[1,4)$.** The invariant $S_i \in [1,2)$ and the free leading digit $d_0=1$ both depend on it; feed an unreduced significand and $U_i$ overflows `ufix(1,-i-1)`.
- **One digit per cycle, full stop.** Latency is $n+1$ cycles for $n$ fractional bits and there is no radix-2 escape from it. Past roughly single precision the linear latency is what pushes designs to [[SRT Square Root]] or to Newton–Raphson.
- **The sign test needs a propagated carry.** $d_{-i}$ is the MSB of $T_i$, so $T$ cannot be kept in carry-save; the per-iteration critical path is a full $n{+}4$-bit carry propagation and it does not shrink with radix. That is precisely the wall [[SRT Square Root]] breaks with a redundant digit set.
- **Folding in time throws away the width argument.** The $i+4$-bit result only pays off unrolled in space or in a pipeline with per-stage widths; a single shared adder must be sized for the last iteration.
- **No [[On-the-Fly Converter]] is needed here** — binary digits are non-negative, so $S_i$ is built by pure concatenation. Add a negative digit and that stops being true, and the converter's two muxes and two registers per iteration reappear.

> [!warning] Not covered in the source — needs outside research
> Chapter 19 gives **no LUT, slice or delay figures** for either square-root variant. "Lower area and shorter critical path than restoring" (p. 580) is reported as an experimental finding by the authors on current FPGAs, without numbers. Any quantified comparison here would be invented.

**RTL (Spade).** One iteration, generic in the fractional precision $N$. All values are integers scaled by $2^N$; the iteration index enters as a one-hot mask `p` $= 2^{-i}$ rather than as a shift amount, because that is what a folded implementation actually holds.

```spade
// t : T_i,      sfix(2,-N)  -> int<N+3>
// s : S_{i-1},  ufix(1,-N)  -> uint<N+2>
// p : one-hot 2^{-i}        -> uint<N+2>
entity nrsqrt_step<#uint N>(
    t: int<{N + 3}>,
    s: uint<{N + 2}>,
    p: uint<{N + 2}>,
) -> (bool, uint<{N + 2}>, int<{N + 3}>) {
    let q = p >> 1;                                  // 2^{-i-1}
    let d = !t.sign_bit();                           // digit = inverted sign bit
    let s_next = if d { s | p } else { s };          // concatenation, not an add
    let addend = if d { q } else { p | q };          // 2^{-i} dbar + 2^{-i-1}
    let s2: uint<{N + 3}> = zext(s_next) << 1;       // 2 S_i
    let u: uint<{N + 3}> = trunc(s2 + zext::<{N + 2}, {N + 3}>(addend));
    let uv: int<{N + 5}> = sext(u.to_int());
    let t2: int<{N + 5}> = sext(t) << 1;             // 2 T_i
    let t_next: int<{N + 3}> = trunc(if d { t2 - uv } else { t2 + uv });
    (d, s_next, t_next)
}
```

`d` is the inverter on the diagram, `s_next` the upper concatenation box, `u` the lower one, and the single `if d { t2 - uv } else { t2 + uv }` is the add/sub — the whole entity is combinational, so the two registers are $T$ and $S$ in the caller. The `|` in `s_next` and `addend` are ORs only because the target bit is provably zero; synthesis emits no logic for them, just wiring, exactly as the diagram claims. The `<< 1` are hard-wired shifts. What synthesis will *not* reproduce from the drawing is the per-step narrowing: `nrsqrt_step` is written at the full $N{+}4$-bit width for every $i$, so the $i+4$-bit saving only appears if the entity is instantiated once per iteration with $N$ specialised, not folded onto one shared adder.

**Iteration count and loop control.** For $n$ fractional result bits the operator runs $i = 0 \ldots n$, i.e. $n+1$ iterations, plus one more if round-to-nearest is wanted. Folded, the loop control is an $(n{+}2)$-bit one-hot shift register holding `p` (one flip-flop per bit, shifted right each cycle — cheaper than a counter plus a $1\!:\!n$ decoder, and it *is* the $2^{-i}$ the recurrence needs), the $T$ and $S$ registers at $n{+}3$ and $n{+}2$ bits, and a done flag when `p` shifts out. There is no state machine beyond that: every cycle does the same thing.

**Related Notes**

- [[Restoring Square Root]] – extends: this is that recurrence with the restore mux folded into the next iteration's addend sign.
- [[Non-Restoring Division]] – compares: the same deferral one polynomial degree down, where the multiplicand is a constant divisor instead of the result being built.
- [[SRT Square Root]] – extends: replaces the sign test with a redundant digit set so the residual can stay carry-save and the radix can rise.
- [[Square Root Range Reduction]] – depends-on: supplies the even exponent and $M \in [1,4)$ this recurrence assumes.
- [[On-the-Fly Converter]] – counter-example: the machinery that is *not* needed here, and becomes mandatory the moment a digit can be negative.
- [[RCA, Ripple-Carry Adder]] – supports: the $i{+}4$-bit add/subtract, mapped onto the FPGA carry chain.
- [[Lookup-Tables]] – supports: the LUT and fast-carry structure that makes this form beat the restoring one.
- [[FloPoCo]] – supports: `flopoco FPSqrt wE=8 wF=23` generates exactly this operator.
- [[Choosing a Digit Recurrence]] – compares: where this sits against every sibling in the family.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §19.1.4 *Binary Non-restoring Square Root*, Eqs. (19.18)–(19.26), Fig. 19.3 — pp. 578–580
- §19.1.3 restoring recurrence Eqs. (19.14)–(19.17), the $i+3$-bit subtracter and the FloPoCo `method=0` invocation — pp. 576–578
- FPGA mapping and the FloPoCo default, p. 580; on-the-fly conversion as the contrast case, §19.1.5.4, pp. 587–588
