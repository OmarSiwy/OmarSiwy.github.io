---
title: Square Root Seed Table
description: Tabulates S_i0 (and S_i0 squared) from the 8 leading bits of M to skip the first iterations; the width constraint fails outright unless the table rounds to nearest.
kind: circuit
source: "ASA §19.1.5.2, pp. 584-585"
status: seed
spade: simulated
tags: [digital, digit-recurrence-for-algebraic-functions, square-root, table, rom]
aliases:
  - Seed Table
  - Square Root Seed ROM
  - Tabulated Initialization
  - Alternative Initialization by Tabulation
---

# Square Root Seed Table

A ROM addressed by the leading bits of $M$ that returns $S_{i_0}$ and $S_{i_0}^2$ at once, so the digit recurrence can start at iteration $i_0$ instead of $0$ — and it is legal only because the table rounds to nearest.

```tikz title="Square root seed table: leading bits of M address a ROM holding S_i0 and its square; one subtracter forms the starting residual W_i0"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex, font=\small,
  blk/.style={draw, rounded corners=1pt, align=center, inner sep=4pt}]

  % ---- input bus and its fan-out
  \draw[->] (-2.9,0) -- (-1.1,0);
  \node[anchor=south] at (-2.0,0.08) {$M$};
  \node[anchor=north,font=\footnotesize] at (-2.0,-0.08) {\texttt{ufix(1,$-n$)}};
  \fill (-1.1,0) circle (1.6pt);
  \draw (-1.1,0) -- (-1.1,1.9)  -- (-0.35,1.9);
  \draw (-1.1,0) -- (-1.1,-1.9) -- (3.55,-1.9);
  \draw[->] (-0.35,1.9) -- (-0.05,1.9);
  \draw[->] (3.55,-1.9) -- (3.85,-1.9);

  % ---- truncation
  \node[blk,minimum height=1.0cm,minimum width=2.1cm] (tr) at (1.05,1.9)
       {truncate to\\[-1pt] $\ell=-\alpha i_0-1$};
  \draw[->] (2.1,1.9) -- (3.3,1.9);
  \node[anchor=south,font=\footnotesize] at (2.7,1.98) {$\lfloor M\rfloor_\ell$};
  \node[anchor=north,font=\footnotesize] at (2.7,1.82) {8 b};

  % ---- the table
  \node[blk,minimum height=2.0cm,minimum width=2.7cm] (rom) at (4.65,1.9)
       {seed table\\[1pt] $2^{8}\times 23$ b\\[1pt] \footnotesize round to nearest};
  \draw[->] (6.0,2.5) -- (10.05,2.5);
  \node[anchor=west,font=\footnotesize] at (6.15,2.75) {$S_{i_0}$: \texttt{ufix(1,$-\alpha i_0$)}, 8 b};
  \node[anchor=west,align=left,font=\footnotesize] at (10.2,2.5) {to digit selection\\ and on-the-fly conversion};

  % ---- S^2 down into the subtracter
  \draw (6.0,1.3) -- (6.6,1.3) -- (6.6,0.1) -- (4.65,0.1);
  \draw[->] (4.65,0.1) -- (4.65,-1.4);
  \node[anchor=west,font=\footnotesize] at (6.7,0.75) {$S_{i_0}^2$: \texttt{ufix(2,$-2\alpha i_0$)}, 15 b};

  % ---- subtracter and the free scaling
  \node[blk,minimum height=1.0cm,minimum width=1.6cm] (sub) at (4.65,-1.9) {$-$};
  \draw[->] (5.45,-1.9) -- (6.45,-1.9);
  \node[blk,minimum height=1.0cm,minimum width=2.8cm] (sc) at (7.85,-1.9)
       {$\times\,\beta^{i_0}$: relabel\\[-1pt] \footnotesize the binary point};
  \draw[->] (9.25,-1.9) -- (11.9,-1.9);
  \node[anchor=south,font=\footnotesize] at (10.6,-1.82) {$W_{i_0}$};
  \node[anchor=north,font=\footnotesize] at (10.6,-2.0) {\texttt{sfix(2,$\alpha i_0-n$)}};

  % ---- what it replaces
  \draw[dashed,gray] (-0.6,-3.1) rectangle (14.6,3.6);
  \node[gray,anchor=west,font=\footnotesize] at (-0.55,3.15)
       {replaces iterations $i=0\ldots i_0-1$ --- $\alpha i_0$ result bits for one table read};
  \node[anchor=north west,align=left,text width=5.2cm,font=\footnotesize] at (-0.5,-0.55)
       {$\ell \le 2+\log_2(\rho-\tfrac12)-\alpha i_0$.\\ Round-\emph{down} in the table would\\ need $\rho>1$: no valid $\ell$ exists.};
\end{circuitikz}
\end{document}
```

*Own construction; widths are those of the $\beta=4$, $\gamma=2$, $i_0=3$ instance of §19.1.5.2–19.1.5.3, pp. 584–585.*

**The seed exists because the free first digit stops being free.** In the non-redundant recurrence, $M\in[1,4)$ forces $\sqrt M\in[1,2)$, so $d_0=1$ and $S_0=1$ can be written down with no hardware ([[Square Root Range Reduction]]). Once the digits come from a redundant set $\{-\gamma,\dots,\gamma\}$ ([[SRT Square Root]]) that stops holding: for $M\in[2,4)$, $S_0=1$ gives $W_0=\beta^0(M-S_0^2)\in[0,3)$, which exceeds the containment bound $2\rho S_0+\rho^2\beta^0\approx1.778$ that the invariant requires. The book's first repair is a two-way choice, $d_0=2$ for $M\in[2,4)$ and $d_0=1$ otherwise (pp. 582–583). The seed table is the second repair, and it generalises: instead of fixing iteration $0$, look up $S_{i_0}$ outright and enter the loop at $i_0$.

**Tabulate the square as well, because the entry cost is a squaring, not a lookup.** Entering at $i_0$ means supplying the residual $W_{i_0}=\beta^{i_0}(M-S_{i_0}^2)$, and that formula contains $S_{i_0}^2$ — a multiply, on the very cycle you were trying to save. Since $S_{i_0}$ is a function of the table address alone, so is its square: put both in the same ROM and the entry cost collapses to one read plus one subtraction. The $\beta^{i_0}$ scaling costs nothing at all — it is a power of the radix, so it is a relabelling of the binary point, not a shifter (p. 584).

**The address is $M$ truncated, and the truncation is what the error budget pays for.** Let $\ell$ be the bit position at which $M$ is truncated before addressing, $\widetilde M=\lfloor M\rfloor_\ell$, and let $\alpha=\log_2\beta$ so one radix-$\beta$ digit is $\alpha$ bits. The table stores $S_{i_0}$ at ulp $\beta^{-i_0}=2^{-\alpha i_0}$. Two independent errors enter: the stored value is a rounded root, and the root that was rounded is the root of a *truncated* $M$. The book's free improvement is to evaluate at the **centre** of the interval that $\widetilde M$ represents rather than at its left end, which halves the second error at zero hardware cost:

$$S_{i_0}=\left\lfloor\sqrt{\widetilde M+2^{\ell-1}}\right\rceil_{-\alpha i_0}$$

**Split the error at the exact root of the centre point.** Write $\delta_{i_0}=S_{i_0}-\sqrt M$ and insert $\pm\sqrt{\widetilde M+2^{\ell-1}}$, which is legal because it cancels — this is adding zero:

$$\delta_{i_0}=\underbrace{\left(S_{i_0}-\sqrt{\widetilde M+2^{\ell-1}}\right)}_{\text{rounding of the stored value}}+\underbrace{\left(\sqrt{\widetilde M+2^{\ell-1}}-\sqrt M\right)}_{\text{input truncation}}$$

The first bracket is a round-to-nearest at ulp $2^{-\alpha i_0}$, so it is bounded by $2^{-\alpha i_0-1}$ by definition of the rounding mode ([[Rounding]]). The second is a difference of square roots, which has no useful bound as written; multiply by the conjugate $\sqrt{\widetilde M+2^{\ell-1}}+\sqrt M$ over itself and the difference of squares collapses the numerator:

$$\sqrt{\widetilde M+2^{\ell-1}}-\sqrt M=\frac{\widetilde M+2^{\ell-1}-M}{\sqrt{\widetilde M+2^{\ell-1}}+\sqrt M}$$

The numerator is bounded by $2^{\ell-1}$ — that is precisely the statement that centring the interval halves the truncation error. The denominator is at least $2$, since range reduction guarantees $M\ge1$ and hence both roots are $\ge1$. By the triangle inequality on the two brackets,

$$|\delta_{i_0}|\;\le\;2^{-\alpha i_0-1}+2^{\ell-2}$$

**Force that under the invariant and the table width falls out.** The digit-recurrence convergence condition is $|\delta_{i_0}|\le\rho\beta^{-i_0}=\rho\,2^{-\alpha i_0}$, with $\rho=\gamma/(\beta-1)$ the redundancy factor of the digit set ([[Number Formats]]). Substituting the bound and dividing through by $2^{-\alpha i_0}$ gives $\tfrac12+2^{\ell+\alpha i_0-2}\le\rho$; isolating the power of two and taking $\log_2$ of both sides — monotone, so the direction of the inequality survives — yields the constraint boxed below. For $\beta=4$, $\gamma=2$, hence $\rho=2/3$, it evaluates to $\ell\le-\alpha i_0-0.585$, so the largest admissible integer is $\ell=-\alpha i_0-1$: exactly one bit of $M$ below the table's own ulp (p. 584).

**Rounding down is not a cheaper option; it is not an option.** Store $\lfloor\cdot\rfloor$ instead of $\lfloor\cdot\rceil$ and the first bracket doubles to $2^{-\alpha i_0}$, so the same algebra returns $\ell\le2+\log_2(\rho-1)-\alpha i_0$. Since $\rho=\gamma/(\beta-1)\le1$ for every digit set — $\gamma=\beta-1$ is maximal redundancy — the argument of the logarithm is non-positive and **no $\ell$ exists at all**. The failure is not a lost bit of accuracy, it is the disappearance of the feasible region: the invariant is violated for some inputs however wide the address bus is made. Sweeping the $i_0=1$ instance below over its whole domain confirms it — round-to-nearest never leaves the containment band, round-down leaves it on roughly a third of the inputs.

> [!important]
> The temptation is to read $\lfloor\cdot\rceil$ as a nicety worth one ulp. It is load-bearing: the seed table is the one place in the operator where the rounding mode of a stored constant decides whether the algorithm converges at all.

**Widths, for $\beta=4$, $\gamma=2$, $i_0=3$.** The stored $S_{i_0}$ reaches the value $2$ exactly (the same endpoint the $d_0=2$ initialisation reaches), so it is `ufix(1,`$-\alpha i_0$`)`, i.e. $\alpha i_0+2=8$ bits, and that leading bit of weight $2$ cannot be optimised away: bounding $S_{i_0}<2$ would require rounding down, which the previous paragraph just ruled out (p. 585). $S_{i_0}^2$ is the exact square, `ufix(2,`$-2\alpha i_0$`)` $=15$ bits. The residual is `sfix(2,`$\alpha i_0-n$`)` for an $n$-bit $M$ — three integer bits including sign, because $|W_{i_0}|\le2\rho S_{i_0}+\rho^2\beta^{-i_0}<3$. Total data width $8+15=23$ bits.

> [!warning] Bit-count discrepancy in the source
> With $\ell=-\alpha i_0-1=-7$ and $M\in[1,4)$, the retained bits run from weight $2^1$ down to $2^{-7}$ — **nine** bits, not the "8 leading bits of $M$" stated on p. 585. The count reconciles only if the address is read as the exponent parity plus the seven leading bits of $F$, which relaxes $\ell$ to $-6$ on the odd-exponent branch and so violates the constraint there. The book does not say which reading it intends. Size the table from the constraint, not from the sentence; the FPGA mapping below is unchanged either way.

**FPGA versus ASIC mapping.** At $2^8$ or $2^9$ entries of $23$ bits the table is $5.9$ or $11.8$ kbit, and a Xilinx 18 Kb block RAM in its $512\times36$ simple-dual-port geometry swallows either — one [[Block Memory]] primitive, one cycle of latency, zero logic ([[FPGAs]]). As distributed ROM the same table costs $2^{8-6}=4$ LUT6 plus an F7/F8 mux pair *per output bit*, about one slice each and $\approx92$ LUT6 for all 23, which is why the block RAM wins at this width and would not at a quarter of it. On an ASIC the content becomes a synthesised ROM or a minimised logic cone, and the honest comparison is against the $i_0$ iterations it replaces: the book's judgement is that at $i_0=3$ the seed costs about what one further iteration costs, so it buys $\alpha i_0=6$ result bits for the price of one (p. 585).

**Where the table's leverage stops.** Because $|\ell|=\alpha i_0+1$, the address width grows linearly in $i_0$ and the table area therefore grows like $\beta^{i_0}$, while the iterations it replaces grow only linearly. Every extra skipped iteration multiplies the ROM by $\beta$. That exponential is the same wall [[Table-Based Function Evaluation]] hits when tabulating a function outright, and it is why the seed is a way to *start* a recurrence rather than a way to avoid one.

$$\boxed{\;\ell \;\le\; 2+\log_2\!\left(\rho-\tfrac12\right)-\alpha i_0,\qquad \rho=\frac{\gamma}{\beta-1},\quad \alpha=\log_2\beta\;}$$

**When it breaks**

- $\rho\le\tfrac12$ — a non-redundant or barely redundant digit set — makes $\log_2(\rho-\tfrac12)$ undefined or $-\infty$: no seed table of any width converges. Tabulated initialisation is a benefit redundancy pays for, not a free trick.
- Rounding down in the table needs $\rho>1$, which no digit set provides. Directed rounding is unusable here even though it is the cheaper hardware.
- Table area is $\Theta(\beta^{i_0})$ against $\Theta(i_0)$ iterations saved; past $i_0\approx3$ for radix 4 the ROM stops paying and a wider radix serves the operator better.
- The bottom quarter of the address space ($M<1$) is unreachable after range reduction and is wasted unless the address is re-encoded — a real cost when the table is a hard block of fixed depth.
- The seed fixes *initialisation* only. The per-iteration critical path still belongs to [[Square Root Digit Selection Function]], and $S_{i_0}$ still has to reach the recurrence in conventional binary, so [[On-the-Fly Converter]] is required from $i_0$ onward regardless.
- Ties in the round-to-nearest may be broken arbitrarily; the bound $2^{-\alpha i_0-1}$ is attained either way, unlike in a result rounding where the tie rule is observable ([[Error Accuracy]]).

**RTL (Spade)**

The instance below is $\beta=4$, $\gamma=2$, $i_0=1$: small enough that the table is a literal, and a genuine instance of the constraint, since $\ell\le2+\log_2(1/6)-2=-2.585$ forces $\ell=-3$ and a 5-bit address.

```spade
/// Radix-4 square-root seed table, i0 = 1 (alpha = 2, gamma = 2, rho = 2/3).
/// Address: M truncated at l = -alpha*i0 - 1 = -3;  M in [1,4) => ufix(1,-3), 5 bits.
/// Data:    S_1   = round-to-nearest of sqrt(Mtilde + 2^(l-1)) at ulp 2^-2, ufix(1,-2)
///          S_1^2 exact,                                                    ufix(2,-4)
fn seed_rom(a: uint<5>) -> (uint<4>, uint<7>) {
    let s: [uint<4>; 32] = [0, 0, 0, 0, 0, 0, 0, 0,
                            4, 4, 5, 5, 5, 5, 5, 6,
                            6, 6, 6, 6, 6, 7, 7, 7,
                            7, 7, 7, 7, 8, 8, 8, 8];
    let q: [uint<7>; 32] = [0,  0,  0,  0,  0,  0,  0,  0,
                            16, 16, 25, 25, 25, 25, 25, 36,
                            36, 36, 36, 36, 36, 49, 49, 49,
                            49, 49, 49, 49, 64, 64, 64, 64];
    (s[a], q[a])
}

/// m is M at ulp 2^-8, ufix(1,-8).
/// Returns S_1 at ulp 2^-2 and W_1 = beta * (M - S_1^2) at ulp 2^-6.
entity sqrt_seed_init(m: uint<10>) -> (uint<4>, int<12>) {
    let (s, q) = seed_rom(trunc(m >> 5));
    let q8: uint<11> = zext::<7, 11>(q) << 4;
    let mi: int<12> = sext(m.to_int());
    let qi: int<12> = q8.to_int();
    let w: int<12> = trunc(mi - qi);
    (s, w)
}
```

`trunc(m >> 5)` is the truncation box in the diagram — five wires tapped off the top of $M$, no gates. `seed_rom` is the ROM itself: a `[T; 32]` indexed by a runtime `uint<5>`. The subtracter is `mi - qi`, after `<< 4` aligns $S_1^2$ from ulp $2^{-4}$ to $2^{-8}$, which is again pure wiring. The $\times\beta^{i_0}$ block of the diagram appears nowhere in the code: reading the same `int<12>` at ulp $2^{-6}$ instead of $2^{-8}$ *is* the multiplication by $4$. The block is combinational as written; synthesis will register the table output, because a block RAM read is synchronous and there is no asynchronous mode to fall back on.

Simulated with iverilog over all 768 values of $M\in[1,4)$ at ulp $2^{-8}$ plus 3000 random ones — 3774 vectors, all passing — checking $S_1$ and $S_1^2$ against a `$sqrt` reference and, independently, that $-2\rho S_1+\rho^2\beta^{-1}\le W_1\le 2\rho S_1+\rho^2\beta^{-1}$ holds for every one.

**Related Notes**

- [[Table-Based Function Evaluation]] – depends-on: the seed is one of these tables, sized by a convergence bound instead of by a target accuracy.
- [[Block Memory]] – supports: 23 bits by $2^8$ entries is one 18 Kb block RAM, which is what makes the seed a single-cycle entry on FPGA.
- [[Rounding]] – depends-on: round-to-nearest of the stored constant is the hypothesis the whole width constraint rests on.
- [[Division by Reciprocal]] – compares: the same idea one function over — a table seeds the iteration, and the seed's accuracy sets how many iterations remain.
- [[SRT Square Root]] – extends: this is the initialisation of that recurrence, and $\rho$ is shared between them.
- [[Square Root Range Reduction]] – depends-on: guarantees $M\in[1,4)$, which is what bounds both roots below by 1 in the conjugate step.
- [[Square Root Digit Selection Function]] – supports: the seed also hands over the truncated $S_{i_0}$ that selection reads.
- [[On-the-Fly Converter]] – supports: takes over from $S_{i_0}$ once redundant digits start arriving.
- [[Non-Restoring Square Root]] – counter-example: with a non-redundant binary digit set $d_0=1$ is always valid, so there is nothing for a seed table to fix.
- [[Choosing a Digit Recurrence]] – compares: where the ROM-plus-recurrence hybrid sits against pure tabulation and pure iteration.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §19.1.5.1 *One Detailed Example of Initialization ($\beta=4$ and $\gamma=2$)*, pp. 582–583 — why $d_0=1$ stops being valid under redundancy.
  - §19.1.5.2 *Alternative Initialization by Tabulation*, pp. 584–585 — eqs. (19.36)–(19.41): the centred evaluation point, the conjugate bound, and the infeasibility of rounding down.
  - §19.1.5.3 *Integrating the Error due to Carry-Save Computation*, p. 585 — $i_0=3$ for radix 4, and the 8-leading-bits statement flagged above.
