---
title: "Newton-Raphson Square Root"
description: "Zeroing 1/x^2 - X gives s_{i+1} = s_i(3 - s_i^2 X)/2, converging to the inverse square root without a division — one squarer and two multipliers per step, faithful only."
kind: circuit
source: "ASA §9.6, pp. 302-303"
status: seed
spade: simulated
tags: [digital, dividers, square-root, newton-raphson, iterative, fpga]
aliases:
  - Inverse Square Root Iteration
  - Reciprocal Square Root
  - Newton-Raphson Inverse Square Root
---

# Newton-Raphson Square Root

A quadratically convergent iteration for $1/\sqrt X$ chosen so that its update contains no division and no square root — only multiplications, a constant subtraction and a wired shift.

```tikz title="One Newton-Raphson inverse-square-root iteration, Q2.14 datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  \tikzset{blk/.style={draw, thick, minimum width=1.6cm, minimum height=0.9cm, align=center}}

  % ---- upper row: seed mux, state register, exact squarer, X multiplier
  \node[blk] (mux) at (0,0)   {mux};
  \node[blk] (reg) at (2.6,0) {reg};
  \node[blk] (sq)  at (5.4,0) {squarer\\(exact)};
  \node[blk] (m1)  at (8.4,0) {$\times$};
  \node[blk] (tr)  at (11.2,0) {trunc\\to $2^{-14}$};

  \draw[->,thick] (-1.9,0) -- (mux.west) node[midway,above] {$s_0$} node[midway,below] {16};
  \draw[->,thick] (mux.east) -- (reg.west);
  \draw[->,thick] (reg.east) -- (sq.west);
  \node[anchor=south] at (4.0,0.14) {$s_i$\,, 16};
  \draw[->,thick] (sq.east)  -- (m1.west) node[midway,above] {$s_i^2$} node[midway,below] {32};
  \draw[->,thick] (m1.east)  -- (tr.west) node[midway,below] {48};
  \draw[->,thick] (8.4,1.6)  -- (m1.north) node[midway,right] {\ $X$\,, 16};

  % ---- lower row: 3 - u, s_i multiplier, halving shift
  \node[blk] (sub) at (11.2,-2.6) {$3-\!\cdot$};
  \node[blk] (m2)  at (8.0,-2.6)  {$\times$};
  \node[blk] (sh)  at (4.6,-2.6)  {$\gg 1$\\+ trunc};

  \draw[->,thick] (tr.south) -- (sub.north) node[midway,right] {\ $s_i^2X$\,, 18};
  \draw[->,thick] (sub.west) -- (m2.east) node[midway,above] {$u_i$} node[midway,below] {18};
  \draw[->,thick] (m2.west)  -- (sh.east) node[midway,below] {36};
  \draw[->,thick] (sh.west)  -- (1.6,-2.6) node[midway,above] {$s_{i+1}$} node[midway,below] {16};

  % s_i tapped into the second multiplier
  \draw[thick] (3.65,0) -- (3.65,-1.3) -- (8.0,-1.3);
  \draw[->,thick] (8.0,-1.3) -- (m2.north);
  \node[circ] at (3.65,0) {};

  % feedback to the mux
  \draw[thick] (1.6,-2.6) -- (0,-2.6) -- (0,-0.9);
  \draw[->,thick] (0,-0.9) -- (mux.south);
  \node[circ] at (1.6,-2.6) {};

  % output tap
  \draw[->,thick] (1.6,-2.6) -- (1.6,-4.0) node[below] {$\hat s \approx 1/\sqrt{X}$};

  \node[anchor=west] at (-1.9,-5.0) {one iteration: 1 exact squarer, 2 multipliers, 1 wired shift};
\end{circuitikz}
\end{document}
```

**Zero the function whose root is the answer, not the one whose name is the answer.** The obvious choice $f(x) = x^2 - X$ has root $\sqrt X$, and $f'(x) = 2x$ gives $x_{i+1} = \tfrac12(x_i + X/x_i)$ — a division per step, so it needs precisely the operator this family exists to avoid. Choose instead $f(x) = 1/x^2 - X$, whose root is $1/\sqrt X$ (p. 303). With $f'(x) = -2x^{-3}$, the Newton step $x - f/f'$ expands by substituting and clearing the negative powers:

$$s_{i+1} = s_i - \frac{s_i^{-2} - X}{-2s_i^{-3}} = s_i + \frac{s_i^3\,(s_i^{-2} - X)}{2} = \frac{3s_i - s_i^3X}{2} = \frac12 s_i\left(3 - s_i^2X\right) \tag{9.111}$$

Every operation on the right is a multiplication, a subtraction from the constant $3$, or a division by $2$ — a wire. This is the same trade the reciprocal iteration makes in [[Newton-Raphson Reciprocal]]: pay for the inverse function, get the direct one back with one extra multiply.

**Quadratic convergence, but with a $3/2$ and a sign.** Write the current iterate in terms of its relative error, $s_i = (1+\varepsilon_i)/\sqrt X$, so that $s_i^2X = (1+\varepsilon_i)^2$ exactly. Substituting into (9.111) and expanding the product — ordinary binomial expansion, no approximation:

$$s_{i+1} = \frac{1+\varepsilon_i}{\sqrt X}\cdot\frac{3 - (1+\varepsilon_i)^2}{2} = \frac{(1+\varepsilon_i)\left(1 - \varepsilon_i - \tfrac12\varepsilon_i^2\right)}{\sqrt X} = \frac{1 - \tfrac32\varepsilon_i^2 - \tfrac12\varepsilon_i^3}{\sqrt X}$$

$$\varepsilon_{i+1} = -\tfrac12\varepsilon_i^2\left(3 + \varepsilon_i\right)$$

Two things follow that the reciprocal case does not have. First, $|\varepsilon_{i+1}| \approx \tfrac32\varepsilon_i^2$, so the correct-bit count doubles *minus* $\log_2\tfrac32 \approx 0.58$ bit per step, where the reciprocal's $e_{i+1} = e_i^2$ (9.55) doubles exactly. Over four steps that is under two bits — one guard bit covers it. Second, $\varepsilon_{i+1} < 0$ for every $\varepsilon_i > -3$, so from $i \ge 1$ the iterate approaches $1/\sqrt X$ strictly **from below**. Being one-sided is worth a bit of range, exactly as $r_i \le 1/D$ is in the reciprocal datapath (p. 292).

**The convergence domain is enforced by the subtractor, for free.** Requiring $|\varepsilon_{i+1}| < |\varepsilon_i|$ gives $\left|\varepsilon_i(3+\varepsilon_i)\right| < 2$; solving the two quadratics separately yields $-1 < \varepsilon_i < \tfrac{\sqrt{17}-3}{2} \approx 0.562$. In hardware that condition is visible as the sign of $u_i = 3 - s_i^2X$: since $s_i^2X = (1+\varepsilon_i)^2$, staying in the domain keeps $0 < u_i < 3$, so an **unsigned** subtractor with two integer bits suffices and never borrows out. A seed accurate to even two bits sits far inside this window, so no divergence check is needed at run time — but see *When it breaks* for what an out-of-domain seed does to an unsigned datapath.

**Self-correcting, for the same structural reason as the reciprocal.** The residual $u_i = 3 - s_i^2X$ is recomputed from the *actual* stored $s_i$ against $X$ every step, never carried forward. A rounding error injected into $s_i$ is therefore re-measured by the next $u_i$ and squared away with everything else, which is what licenses truncated multipliers here: keep each step's rounding error of the order of $\varepsilon_i^2$ and near-quadratic convergence survives (the design rule of p. 293, stated there for $1/D$). The squarer itself must stay **exact** — a truncated squarer injects an error of the order of the output ulp rather than $\varepsilon_i^2$, which stops $s_{i+1}$ from being twice as accurate as $s_i$ and collapses the iteration to linear. Use the dedicated structure in [[Squarers and Integer Powers]], not a general multiplier with both inputs tied together.

**Cost of one step: one exact squarer and two multipliers, in series.** The dependency chain is $s_i \to s_i^2 \to s_i^2X \to s_i u_i$: three multiplier delays deep, against two for the reciprocal's $r_i \to r_i^2 \to Dr_i^2$. That extra level is the price of the square root, and it is why the [[Goldschmidt Division]] variant of the square root [PB02] is attractive when the operator must be pipelined — its two products are independent and issue together. The halving is a relabelling of the binary point, not logic, and $3 = 11_2$ makes $u_i$ a subtraction from a two-bit constant.

**Widths grow, so the iteration is not one fixed datapath repeated.** With $\ell_{i+1} \approx 2\ell_i$ the operand width doubles every step, so an unrolled-in-space operator uses a different, larger multiplier at each stage, while a folded one must be built at the *final* width and is idle-wide in early steps. Given a seed good to $|\ell_0|$ bits and a target of $w_F$ fraction bits, the step count is $\lceil \log_2(w_F/|\ell_0|)\rceil$, as for the reciprocal (p. 294) — a $2^{-8}$ seed reaches single precision in two steps and double precision in three. Loop control costs a $\lceil\log_2 i_{\max}\rceil$-bit counter, one mux in front of the state register to select seed versus feedback, and a done comparator: negligible against three multipliers, but it does put a mux in the recurrence's critical path.

**Getting $\sqrt X$ back is one more multiplication.** By the exponent identity $X \cdot X^{-1/2} = X^{1/2}$, a single multiply after the last iteration converts the inverse square root into the square root, and many consumers (vector normalisation, Gaussian elimination pivots) want $1/\sqrt X$ directly and skip it. Argument reduction is where square root differs from division: for a [[Floating-Point Operators]] input $2^E M$, $\sqrt{2^EM} = 2^{E/2}\sqrt M$ only halves the exponent cleanly when $E$ is even, so odd exponents must be absorbed by shifting $M$ into $[1,4)$ before the iteration, widening the seed table's input range by one bit. Fixed-point notation and the meaning of $\ell$ throughout are those of [[Number Formats]]; the error budget is assembled as in [[Error Accuracy]].

$$\boxed{\ s_{i+1} = \tfrac12 s_i\left(3 - s_i^2X\right), \qquad \varepsilon_{i+1} = -\tfrac12\varepsilon_i^2(3+\varepsilon_i)\ }$$

> [!warning] The source gives (9.111) and nothing else
> Chapter 9 devotes four sentences to square root (p. 303): it names the function to zero, states the recurrence, and points at the Goldschmidt variant [PB02] and at polynomial approximation. The error recurrence, the convergence interval $-1 < \varepsilon_0 < (\sqrt{17}-3)/2$ and the operand-width discussion above are derived here from (9.111) and from the reciprocal analysis of §9.3, not quoted. No LUT, DSP or delay figures for square root appear anywhere in the chapter; a real sizing needs outside data.

**Where it stops paying.**

- **$X = 0$ has no inverse square root.** The iteration diverges rather than saturating, so zero (and, in floating point, negative operands) must be caught before the datapath, not inside it.
- **An out-of-domain seed corrupts the datapath silently.** If $s_i^2X > 3$ the subtractor borrows out; in the unsigned datapath above that wraps modulo $2^{18}$ and the next iterate is garbage that still looks like a valid number. The seed table is the only guard — size it, do not assume it.
- **Faithful only.** Like every multiplicative method, this produces no exact remainder, so a correctly rounded result needs an extra $X - S^2$ residual computation and a comparison. If correct rounding is the requirement, [[Digit Recurrence for Algebraic Functions]] delivers it as a by-product instead.
- **Small widths do not pay for an iteration.** Below roughly 16 bits a single degree-2 [[Polynomial Approximation]] of $1/\sqrt X$ or of $\sqrt X$ beats seed-plus-iteration outright, since $\sqrt{\cdot}$ is unary and tabulating a unary function is cheap.
- **Quantised multiplier granularity flattens the width argument.** The doubling datapath saves nothing on an FPGA where every step's multiplier rounds up to the same DSP-block tiling; the saving is real on ASIC and on LUT-built multipliers.
- **Three multipliers deep per step.** Where latency rather than area binds, the parallel-product Goldschmidt square root shares the divider's hardware [PB02] and shortens the step; see [[Choosing a Divider]].

**RTL.** One iteration of the recurrence, with $X$ and $s_i$ both in unsigned Q2.14 — the diagram's widths made concrete.

```spade
/// One Newton-Raphson inverse-square-root step in unsigned Q2.14:
/// s_{i+1} = s_i (3 - s_i^2 X) / 2
fn isqrt_step(s: uint<16>, x: uint<16>) -> uint<16> {
    let sq: uint<32> = s * s;                        // exact squarer: s^2 . 2^28
    let sqx: uint<64> = sq * zext::<16, 32>(x);      // s^2 X . 2^42
    let t: uint<18> = trunc(sqx >> 28);              // truncated multiplier: s^2 X . 2^14
    let u: uint<18> = 49152 -. t;                    // 3 . 2^14 - s^2 X . 2^14
    let p: uint<36> = zext::<16, 18>(s) * u;         // s(3 - s^2 X) . 2^28
    trunc(p >> 15)                                   // divide by 2, back to Q2.14
}

/// The iteration: one step per cycle, `start` reloads the seed s0 from the table.
entity isqrt_iter(clk: clock, start: bool, s0: uint<16>, x: uint<16>) -> uint<16> {
    reg(clk) s reset(start: s0) = isqrt_step(s, x);
    s
}
```

`isqrt_step` is the whole drawn datapath, purely combinational: `sq` is the exact squarer, `sqx` then `t` are the $\times X$ multiplier and its truncation to $2^{-14}$, `u` is the $3-\cdot$ block and `p >> 15` is the $\times s_i$ multiplier followed by the halving shift, the two shifts having been merged into one $\gg 15$. `isqrt_iter` adds only the register and the seed mux — `reset(start: s0)` *is* the mux, and holding $X$ constant across the loop is the caller's job. Spade's `*` requires equal operand widths, so `x` is zero-extended to 32 bits and the top 16 bits of the 64-bit product are constant zero; synthesis prunes them, which is why the diagram labels that wire 48. `-.` is the wrapping subtract: it is correct only inside the convergence domain, exactly the corner listed above.

Compiled clean and simulated with `sim.sh`: 4000 random $(s, X)$ pairs against a behavioural model of the same integer recurrence, plus the fixed point $s = X = 1$, the asymmetric pairs $(1, 128)$ and $(128, 1)$, the extremes $(0, 2^{16}-1)$ and $(2^{16}-1, 0)$, and four full eight-step runs for $X \in \{1, 1.25, 1.5, 1.75\}$ that each land within $10^{-3}$ of $1/\sqrt X$.

**Related notes.**

- [[Newton-Raphson Reciprocal]] – compares: the same zero-finding template applied to $f(r) = 1/r - D$; one multiplier cheaper per step, and its error squares exactly rather than picking up the $3/2$.
- [[Squarers and Integer Powers]] – depends-on: supplies the $s_i^2$ block, which must be the exact structure and not a truncated one.
- [[Reciprocal Seed Table]] – supports: the same table construction supplies $s_0$ here, sized against $\varepsilon_0$ instead of $e_0$ and read on a significand ranged over $[1,4)$.
- [[Digit Recurrence for Algebraic Functions]] – counter-example: computes $\sqrt X$ with an exact remainder and hence correct rounding, which no multiplicative method gets for free.
- [[Polynomial Approximation]] – supports: seeds the iteration, and replaces it entirely once the target width is small enough.
- [[Goldschmidt Division]] – compares: its square-root variant shares most of the divider's hardware and issues its two products in parallel, at the cost of not self-correcting.
- [[Floating-Point Operators]] – extends: exponent parity, the $[1,4)$ significand range and the zero/negative special cases live at that level, not in this datapath.
- [[Choosing a Divider]] – compares: where the multiplicative square-root family sits against the digit-recurrence one.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.6 square root: the $X = S^2 + R$, $0 \le R < 2S+1$ formulation and its correspondence with $X = QD + R$; the Newton-Raphson iteration on $f(x) = 1/x^2 - X$, (9.111); the Goldschmidt variant sharing divider hardware [PB02]; polynomial approximation of a unary function [Din+10; Pas12], pp. 302-303.
- §9.3 Newton-Raphson for the reciprocal, (9.52)-(9.62): the quadratic-convergence argument, the self-correction property, the seed-table construction and the datapath-sizing rule reused here, pp. 291-294.
