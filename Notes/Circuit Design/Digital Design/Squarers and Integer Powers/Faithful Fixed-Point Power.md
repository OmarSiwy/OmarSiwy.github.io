---
title: "Faithful Fixed-Point Power"
description: "Runs the same recursion with |X|<1 and every intermediate clamped to the output width plus one guard bit per operation, using truncated squarers and multipliers so widths stay constant down the chain."
kind: circuit
source: "ASA §14.3.3, p. 451"
status: seed
spade: simulated
tags: [digital, squarers-and-integer-powers, power, truncation, faithful, iterative]
aliases:
  - Approximate Fixed-Point Powers
  - Approximate Fixed-Point Power
  - Faithful Fixed-Point Powers
---

# Faithful Fixed-Point Power

A fixed-point $X^p$ operator that runs the square-and-multiply recursion with every intermediate clamped back to the output width plus a few guard bits, so the datapath width is constant around the loop instead of doubling at every squaring.

```tikz title="One iteration of the faithful fixed-point power recurrence: truncated squarer, conditional truncated multiply by X, and the accumulator register"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[scale=1,font=\small]
% ---------------- blocks ----------------
\draw[thick,fill=black!6] (-0.75,-0.5) rectangle (0.75,0.5);
\node[align=center,font=\scriptsize] at (0,0) {reg $A$\\$w{+}g$};
\draw[thick,fill=blue!8] (1.9,-0.55) rectangle (3.6,0.55);
\node[align=center,font=\scriptsize] at (2.75,0) {truncated\\squarer $(\cdot)^2$};
\draw[thick,fill=blue!8] (4.7,-0.55) rectangle (6.4,0.55);
\node[align=center,font=\scriptsize] at (5.55,0) {truncated\\mult.\ $\times X$};
\draw[thick,fill=black!6] (7.5,-0.5) rectangle (8.3,0.5);
\node[font=\scriptsize] at (7.9,0) {mux};
\draw[thick,fill=orange!12] (9.4,-0.5) rectangle (11.3,0.5);
\node[font=\scriptsize] at (10.35,0) {round to $w$};
\node[font=\scriptsize] at (10.35,-0.8) {once, at the end};

% ---------------- datapath ----------------
\draw[->,thick] (0.75,0) -- (1.9,0);
\node[font=\scriptsize,anchor=south] at (1.33,0.06) {$A_k$};
\node[font=\scriptsize,anchor=north] at (1.33,-0.08) {$w{+}g$};
\draw[->,thick] (3.6,0) -- (4.7,0);
\node[font=\scriptsize,anchor=south] at (4.15,0.06) {$A_k^{2}$};
% multiplier -> mux (upper input)
\draw[thick] (6.4,0) -- (6.9,0) -- (6.9,0.28);
\draw[->,thick] (6.9,0.28) -- (7.5,0.28);
% bypass: squarer output straight to mux (lower input)
\fill (4.15,0) circle (0.055);
\draw[thick] (4.15,0) -- (4.15,-1.05) -- (7.1,-1.05) -- (7.1,-0.28);
\draw[->,thick] (7.1,-0.28) -- (7.5,-0.28);
\node[font=\scriptsize,anchor=north] at (5.6,-1.08) {bypass, $p_k=0$};
% mux -> tap
\draw[thick] (8.3,0) -- (8.75,0);
\fill (8.75,0) circle (0.055);
\draw[->,thick] (8.75,0) -- (9.4,0);
\draw[->,thick] (11.3,0) -- (12.2,0);
\node[font=\scriptsize,anchor=south] at (11.8,0.06) {$X^{p}$};
\node[font=\scriptsize,anchor=north] at (11.8,-0.08) {$w$};
% feedback
\draw[thick] (8.75,0) -- (8.75,-2.15) -- (0,-2.15);
\draw[->,thick] (0,-2.15) -- (0,-0.5);
\node[font=\scriptsize,anchor=south] at (4.4,-2.13) {$A_{k+1}$ \ ($w{+}g$ bits, one cycle later)};

% ---------------- X bus ----------------
\draw[thick] (-2.3,1.95) -- (5.55,1.95);
\node[font=\scriptsize,anchor=east] at (-2.35,1.95) {$X$ \ ($w{+}g$)};
\fill (0,1.95) circle (0.055);
\draw[->,thick] (0,1.95) -- (0,0.5);
\node[font=\scriptsize,anchor=west] at (0.08,1.25) {load, $k=\lfloor\log_2 p\rfloor$};
\draw[->,thick] (5.55,1.95) -- (5.55,0.55);

% ---------------- control ----------------
\draw[thick,dashed,fill=black!3] (6.3,1.35) rectangle (12.9,2.6);
\node[align=center,font=\scriptsize] at (9.6,1.98)
  {loop control: a down-counter over the bits of $p$,\\
   hardwired when $p$ is a compile-time constant};
\draw[->,thick,dashed] (7.9,1.35) -- (7.9,0.5);
\node[font=\scriptsize,anchor=west] at (7.98,0.95) {$p_k$};

% ---------------- widths note ----------------
\node[font=\scriptsize,anchor=west] at (-2.35,-2.70)
  {Every product is $2(w{+}g)$ bits wide internally; only its top $w{+}g$ bits leave the operator,};
\node[font=\scriptsize,anchor=west] at (-2.35,-3.10)
  {so the loop width is constant. $\lfloor\log_2 p\rfloor$ iterations; the mux selects the product $\nu(p)-1$ times.};
\end{circuitikz}
\end{document}
```

*Own construction; §14.3.3 carries no figure.*

**Bound the value before you try to bound the width.** The whole construction is unlocked by the input format, not by the algorithm. When $X$ arrives in $\mathrm{ufix}(-1,-w)$ — MSB weight $2^{-1}$, $w$ fractional bits — or in $\mathrm{sfix}(0,-w)$, we have $|X|<1$ and therefore $|X^{p}|<1$ for every $p\ge 1$ ([[Number Formats]]). The power cannot escape the input's own format, so in practice the output *is* that format: $w$ fractional bits, the same $w$ that came in. The exact value, by contrast, lives in $\mathrm{ufix}(-p,-pw)$: $p$ times as many fractional bits, of which the application will keep the top $w$ and throw away $(p-1)w$. Building those bits and then deleting them is the waste this note removes.

**Correct rounding is what forces you to build the exact value.** Rounding $X^p$ to nearest at weight $2^{-w}$ requires knowing the tail below $2^{-w}$, because an intermediate result sitting arbitrarily close to a midpoint cannot be decided without it ([[Rounding]]). Faithful rounding — any result within $1$ ulp of the exact one, [[Error Accuracy]] — carries no such obligation: it only demands a total error budget, and a budget can be *spent*, distributed across a chain of deliberately sloppy operators. That is the entire difference between this note and an exact $X^p$.

**Turn the chain into a recurrence over the bits of $p$.** Write $p=\sum_{k=0}^{K}p_k2^{k}$ with $p_K=1$, so $K=\lfloor\log_2 p\rfloor$. Left-to-right binary exponentiation consumes the leading bit by initialisation and then one bit per step:

$$A_K = X,\qquad A_{k}= A_{k+1}^{2}\cdot X^{p_k}\quad (k=K-1,\dots,0),\qquad A_0=X^{p}$$

Correctness is an induction on the standard identity $X^{2q+p_k}=(X^{q})^{2}\cdot X^{p_k}$ — the same case split as the [[Square-and-Multiply Power Chain]], only read MSB-first so that the *same* physical operand $X$ is the multiplicand at every step. That is what makes it foldable into one datapath: right-to-left exponentiation would need the running square $X^{2^k}$ as a second live value, i.e. a second register and a general two-operand multiplier instead of a squarer.

**Clamp inside the loop, not just at the exit.** Each step's exact product is $2(w+g)$ bits wide; keep only its top $w+g$ and discard the rest, which is precisely a [[Truncated Squarer]] and a truncated multiplier ([[Truncated Multipliers]]) rather than a full operator followed by a shift. The columns below weight $2^{-(w+g)}$ are never built, so the saving is in the bit heap, not in a downstream slice. Widths around the loop are then $w+g$ everywhere, forever.

> [!important] Constant width is the whole point, and it is what makes the operator iterative at all
> In the exact chain the last squarer of $X^{34}$ is $16n$ bits in and $32n$ bits out — no two stages are the same circuit, so nothing can be shared. Clamping every stage to $w+g$ makes all $\lfloor\log_2 p\rfloor$ stages *identical*, which is what allows one squarer and one multiplier to be time-multiplexed over $\lfloor\log_2 p\rfloor$ cycles. The area then stops depending on $p$ altogether; only the cycle count does.

**Size the guard bits by propagating the error through the recurrence.** Let $u=2^{-(w+g)}$ be the internal ulp and let $\varepsilon_k = A_k - X^{n_k}$ be the error of the computed value against the exact power it stands for. Truncation of a squaring contributes $\delta\in[0,u)$, and expanding the square by the binomial theorem,

$$A_{k+1}^{2}-\delta=\big(X^{n}+\varepsilon\big)^{2}-\delta=X^{2n}+2X^{n}\varepsilon+\varepsilon^{2}-\delta$$

Since $|X^{n}|<1$ the incoming error is amplified by a factor of at most $2$, and $\varepsilon^2$ is negligible against it, so $|\varepsilon_{k}|\le 2|\varepsilon_{k+1}|+u$. A truncating multiply by $X$ scales the error by $|X|<1$ instead, so it does not amplify at all; bounding both by the worse case and unrolling the linear recurrence from $\varepsilon=0$ over $N$ operations gives a geometric sum:

$$|\varepsilon_{\text{final}}|\;\le\;\big(2^{N}-1\big)\,u,\qquad N=\underbrace{\lfloor\log_2 p\rfloor}_{\text{squarings}}+\underbrace{\nu(p)-1}_{\text{multiplies}}$$

with $\nu(p)$ the population count of $p$. Reserving half an ulp of the *output* for the final rounding leaves $2^{-w-1}$ for everything upstream, and $2^{N}\cdot2^{-(w+g)}\le 2^{-w-1}$ rearranges to $g\ge N+1$ — one guard bit per arithmetic operation, plus one for the final round. This reproduces the book's rule of thumb ("roughly one guard bit per squaring or multiplication", p. 451) and explains where it comes from: each guard bit pays for exactly one doubling of the error.

> [!warning] Not covered in the source — needs outside research
> The book states the one-guard-bit-per-operation rule without derivation and explicitly declines to give an error analysis ("We do not provide a detailed error analysis here", p. 451). The propagation argument above is a reconstruction, and it is deliberately pessimistic: it charges the factor $2$ to multiplications as well as squarings, and it assumes uncompensated truncation. Injecting the compensation constant of [[Truncated Squarer]] into each operator recentres its error to $\pm u/2$ and buys roughly one guard bit back. A tight bound, and any statement about the *average* rather than worst-case error, is not in this source.

**Loop control is cheap, and free when $p$ is a constant.** The sequence of $p_k$ is a $K$-bit shift register plus a $\lceil\log_2(K{+}1)\rceil$-bit down-counter — for $p=34$, five iterations, so a 3-bit counter and five stored bits against a $(w+g)$-bit truncated squarer. When $p$ is fixed at synthesis time, which is the usual case for a specialised operator, the $p_k$ are constants: the mux select is a hardwired function of the counter state and the shift register vanishes. The control overhead is then genuinely negligible, which is why the iteration count, not the control, is the thing to trade.

**FPGA versus ASIC changes what you do with the flat width, not the arithmetic.** On FPGA the clamped square is a fixed $(w+g)\times(w+g)$ tiling that maps onto a fixed set of DSP blocks ([[FPGAs]]); because every iteration is that same tiling, folding to one physical instance and iterating over $\lfloor\log_2 p\rfloor$ cycles reclaims all of it, and DSP blocks are exactly the resource worth reclaiming. On ASIC the same flat width makes full unrolling attractive instead — $\lfloor\log_2 p\rfloor$ identical truncated squarers in a feed-forward chain, pipelined at whatever rate the heap compression allows, with no loop control and no register turnaround at all. The choice is throughput against DSP count, and the arithmetic is identical either way.

$$\boxed{\;A_{k}= \mathrm{tr}_{w+g}\!\Big(\mathrm{tr}_{w+g}\big(A_{k+1}^{2}\big)\cdot X^{p_k}\Big),\qquad g=\lfloor\log_2 p\rfloor+\nu(p)\;}$$

## When it breaks

- **$|X|\ge 1$.** Every line above uses $|X^{n}|<1$: it is what caps the error amplification at $2$ and what keeps the result inside the input format. For $X\in\mathrm{ufix}(m,\ell)$ with $m\ge 0$ the recurrence diverges in both value and error, and the exact chain's doubling widths come back.
- **$X=-1$ in $\mathrm{sfix}(0,-w)$.** The signed format's range is $[-1,\,1-2^{-w}]$, so $|X|=1$ is attainable at exactly one point, where $X^{p}=\pm1$ — not representable in the unsigned output format for even $p$. One input value, catastrophically wrong, invisible to random testing; it needs the same kind of dedicated saturation path as the [[Faithful Square Root Normalization Unit]].
- **Very small $X$.** $X^{p}$ underflows to $0$ well before $p$ gets large. The result is still faithful — $0$ is within $1$ ulp — but the *relative* error is total, so any application that cares about the logarithm of the result needs floating point, not this.
- **Small $w$.** At $8$ bits and below, plain tabulation of $X^p$ is smaller than a single truncated squarer *and* delivers correct rounding for free ([[Table-Based Function Evaluation]]); the whole recurrence is pointless there.
- **Correct rounding required.** No amount of guard bits makes this correctly rounded, only faithful. Push $g$ up and the probability of a wrong last bit falls, but it never reaches zero without the exact tail.
- **Monotonicity.** A faithful result is a relation, not a function, so the computed $X\mapsto X^p$ can be non-monotonic even though $X^p$ is monotonic on $[0,1)$ — a hazard whenever the operator sits inside a comparison or a table lookup.

## RTL (Spade)

```spade
/// Keep only the top half of a double-width product: the truncating
/// square/multiply of ufix(-1, -W) x ufix(-1, -W) -> ufix(-1, -W).
fn hi<#uint W>(p: uint<{2*W}>) -> uint<W> {
    p.as_bits().chunks::<W>()[1].as_uint()
}

/// ONE iteration of the recurrence, MSB-first over the bits of p.
/// `load` seeds the accumulator with X (the leading 1 of p);
/// each subsequent cycle squares, and multiplies by X when p_k = 1.
entity pow_iter<#uint W>(clk: clock, load: bool, x: uint<W>, mul: bool) -> uint<W> {
    decl next;
    reg(clk) a reset(load: x) = next;
    let sq: uint<W> = hi(a * a);
    let next = if mul { hi::<W>(sq * x) } else { sq };
    a
}
```

`W` is the *internal* width $w+g$, not the output width; the final round to $w$ bits happens once, outside this entity. `a * a` is `uint<2W>` — Spade's `*` doubles the width, which is the exact product of the drawing — and `hi` selects the upper `W` bits, i.e. the truncated squarer's output; `chunks::<W>()[1]` is the high half because array element $0$ is the LSB. The `mul` input is the diagram's mux select $p_k$ and `load` is its synchronous seed, expressed as `reset(load: x)`. The one thing synthesis does differently from the drawing: `hi(a * a)` asks for a full $2W$-bit multiplier whose low half is then dropped, whereas a real truncated squarer never builds those columns at all — replacing `a * a` with a folded, column-truncated bit heap is the actual area win, and is invisible at this level of the language.

Simulated with a 16-bit datapath against a behavioural model of the same recurrence: named asymmetric vectors (`0xF001`, `0x0003`, `0xFFFF`, `0x8000`, whose high and low product halves differ, so a half-selection or bit-order bug cannot pass), $3000$ random $(X,\text{mul})$ chains of $1$–$4$ iterations, and $200$ vectors checking that two truncated squarings land within $4$ ulp of the exact $X^{4}$ computed in $64$-bit arithmetic — the guard-bit bound above predicts $3$ ulp. All pass.

## Related Notes

- [[Square-and-Multiply Power Chain]] – depends-on: supplies the recursion; this note is that chain with every stage clamped, which is what stops the widths doubling.
- [[Truncated Squarer]] – depends-on: is the squaring stage of the loop, and its compensation constant is what tightens the guard-bit budget.
- [[Truncated Multipliers]] – depends-on: is the conditional $\times X$ stage, and the source of the heap-truncation heuristic used at both.
- [[Rounding]] – compares: correct rounding is the requirement this operator drops in order to exist at all.
- [[Error Analysis]] – supports: the error-propagation machinery the guard-bit count is an instance of.
- [[Table-Based Function Evaluation]] – counter-example: below $8$ bits a table is smaller than one iteration and correctly rounded, so the recurrence loses outright.
- [[Cube Bit Heap]] – compares: the other route to $p>2$, exact and $\Theta(n^3)$ in heap bits, where this one is faithful and constant-width.
- [[Choosing a Squarer]] – compares: where the truncated squarer this loop is built from sits against its siblings.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §14.3.3 Approximate Fixed-Point Powers — $|X|<1$, truncated squarers and multipliers, the one-guard-bit-per-operation rule, p. 451
- §14.3.2 Computing Powers by Squaring and Multiplying — eqs. (14.9)–(14.10), the $\lfloor\log_2 p\rfloor$ / $\nu(p)-1$ cost, p. 450
- §14.2.4 Truncated Squarers — heap truncation and the compensation constant, pp. 446–447
- §7.2.4 Truncated Multipliers — Algorithm 7.1, the truncation and compensation heuristic, pp. 167–173
- [PBM01] Piñeiro, Bruguera & Muller, *Faithful Powering Computation Using Table Look-Up and a Fused Accumulation Tree*, ARITH 2001 (cited p. 451)
