---
title: Quotient Digit Selection Table
description: The combinational block that reads 6 bits of the shifted remainder and 3 bits of the divisor and returns a signed digit — and the one border cell whose mislabelling was the Pentium FDIV bug.
kind: circuit
source: "ASA §9.2.4, pp. 272-279"
status: seed
spade: simulated
tags: [digital, divider, srt, redundant, lut, fpga]
aliases:
  - Quotient Digit Selection
  - QDS
  - QDS Table
  - Selection Function
  - SRT Selection Table
  - Digit Selection Table
---

# Quotient Digit Selection Table

The combinational block that turns a *truncated* view of the divider's state into the next quotient digit — the only part of an SRT divider that must be designed rather than derived, because it is the only part allowed to be approximate.

```tikz title="Radix-4 quotient digit selection on 6 bits of the shifted remainder and 3 bits of the divisor, thresholds shown against the selection-interval overlap bands"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,x=0.88cm,y=0.185cm,>=latex]
  % out-of-convergence: |beta R_i| > beta rho D = (8/3) D
  \fill[black!8] (0,10.667) -- (8,21.333) -- (8,25) -- (0,25) -- cycle;
  \fill[black!8] (0,-10.667) -- (8,-21.333) -- (8,-25) -- (0,-25) -- cycle;
  % overlap bands S_k \cap S_{k+1}, vertical extent (2rho-1)D = D/3
  \fill[black!25] (0,5.333) -- (8,10.667) -- (8,13.333) -- (0,6.667) -- cycle;
  \fill[black!25] (0,1.333) -- (8,2.667)  -- (8,5.333)  -- (0,2.667) -- cycle;
  \fill[black!25] (0,-2.667) -- (8,-5.333) -- (8,-2.667) -- (0,-1.333) -- cycle;
  \fill[black!25] (0,-6.667) -- (8,-13.333) -- (8,-10.667) -- (0,-5.333) -- cycle;
  % truncation grid: 3 bits of D (columns), 6 bits of beta R_i (rows)
  \draw[black!40,very thin] (0,-25) grid[xstep=1,ystep=1] (8,25);
  % selection-interval boundaries beta R_i = (k -+ rho) D
  \draw[black!70,thick] (0,10.667) -- (8,21.333);
  \draw[black!70,thick] (0,-10.667) -- (8,-21.333);
  \foreach \a/\b in {6.667/13.333, 5.333/10.667, 2.667/5.333, 1.333/2.667,
                     -1.333/-2.667, -2.667/-5.333, -5.333/-10.667, -6.667/-13.333}
    \draw[black!70] (0,\a) -- (8,\b);
  % the realised selection function: one threshold per column of truncated D
  \draw[blue,very thick] (0,6)--(1,6)--(1,7)--(2,7)--(2,8)--(4,8)--(4,9)--(5,9)--(5,10)--(7,10)--(7,11)--(8,11);
  \draw[blue,very thick] (0,2)--(4,2)--(4,3)--(8,3);
  \draw[blue,very thick] (0,-2)--(1,-2)--(1,-3)--(4,-3)--(4,-4)--(7,-4)--(7,-5)--(8,-5);
  \draw[blue,very thick] (0,-6)--(1,-6)--(1,-7)--(2,-7)--(2,-8)--(3,-8)--(3,-9)--(4,-9)--(4,-10)--(6,-10)--(6,-11)--(7,-11)--(7,-12)--(8,-12);
  % axes
  \draw[->] (0,-25) -- (0,27) node[anchor=south] {$\beta R_i$ (6 bits, LSB $2^{-3}$)};
  \draw[->] (0,0) -- (8.15,0);
  \foreach \v/\t in {24/3,16/2,8/1,-8/-1,-16/-2,-24/-3}
    \node[anchor=east,font=\footnotesize] at (-0.1,\v) {$\t$};
  \node[anchor=north,font=\footnotesize] at (0,-26) {$\tfrac12$};
  \node[anchor=north,font=\footnotesize] at (8,-26) {$1$};
  \node[anchor=north,font=\footnotesize] at (4,-26.5) {3 bits of $D$, $\Delta D = 2^{-4}$};
  \node[anchor=north,font=\footnotesize] at (4,-31) {$q_{-i}$ is odd-symmetric in $\beta R_i$; both halves shown.};
  % digit regions
  \node[anchor=west,font=\footnotesize] at (8.2,16) {$q_{-i}=+2$};
  \foreach \y/\l in {4.5/{$+1$}, 0/{$0$}, -4.5/{$-1$}, -16/{$-2$}}
    \node[anchor=west,font=\footnotesize] at (8.2,\y) {\l};
  % annotations
  \node[anchor=north west,align=left,font=\footnotesize,text=blue] at (10.6,24)
    {blue: the four thresholds\\ $m_{-1},m_0,m_1,m_2$ the table\\ stores --- one step per\\ column of truncated $D$};
  \node[anchor=north west,align=left,font=\footnotesize] at (10.6,4)
    {grey: the overlap bands\\ $S_k\cap S_{k+1}$, height\\ $(2\rho-1)D=D/3$. Every\\ step lies wholly inside\\ a band --- which is why\\ $6+3$ truncated bits suffice.};
  \node[anchor=north west,align=left,font=\footnotesize] at (10.6,-14)
    {light grey: outside the\\ convergence domain\\ $|\beta R_i|\le\beta\rho D$;\\ true don't-cares.};
\end{circuitikz}
\end{document}
```

*after Fig. 9.7, p. 276; thresholds recomputed from (9.30) and checked exhaustively against all $8\times64$ table entries.*

**Start from the constraint the digit must satisfy, not from the digit.** The digit recurrence is $R_{i+1} = \beta R_i - q_{-i}D$ with the invariant $-\rho D \le R_i \le \rho D$ of (9.28). Substituting the recurrence into the invariant and dividing through by $D > 0$ — which preserves both inequalities — gives (9.30):

$$-\rho \;\le\; \frac{\beta R_i}{D} - q_{-i} \;\le\; \rho$$

Read with $q_{-i}$ as the unknown, this says a digit $k$ is *legal* exactly when the scaled remainder $y = \beta R_i / D$ lies in the **selection interval** $S_k = [k-\rho,\,k+\rho]$, an interval of width $2\rho$ centred on $k$. The selection table is any function that returns some legal $k$; it is not required to return a particular one.

**Redundancy is what makes the table finite.** With the redundancy factor $\rho = \gamma/(\beta-1)$ of (9.29) and $\gamma \ge \beta/2$, consecutive intervals overlap: $k + \rho \ge (k+1) - \rho \iff \rho \ge \tfrac12$, and the overlap has width $2\rho - 1 > 0$. That strictly positive width is the entire budget. If you estimate $y$ with error $|\hat y - y| \le \varepsilon$, a fixed-threshold decision on $\hat y$ is safe as long as every uncertainty band fits inside some $S_k$, which is possible iff $\varepsilon < 2\rho - 1$. A non-redundant digit set gives $\rho = 1/2$, zero overlap, and $\varepsilon = 0$ — you would have to know $y$ exactly, i.e. divide. See [[Redundant Number Systems]] for why the digit set can be widened without changing the value represented.

**Truncating both inputs tiles the plane with rectangles.** Rather than form $y = \beta R_i / D$, hardware compares $\beta R_i$ against $D$ directly: multiplying (9.30) by $D$ turns the interval boundaries into the straight lines $\beta R_i = (k \pm \rho)D$, so in the $(D,\ \beta R_i)$ plane each digit owns a wedge through the origin. Truncating $D$ to $a$ bits and $\beta R_i$ to $b$ bits partitions the plane into rectangles of $2^{-a} \times 2^{-b}$, and a digit may be assigned to a rectangle iff **the whole rectangle** — or at least all of it inside the convergence domain — sits in one wedge. For radix $\beta = 4$, $\gamma = 2$, $\rho = 2/3$ the working sizes are $a = 3$ and $b = 6$ (Fig. 9.7).

**Widths.** $D$ is a normalized significand in $[\tfrac12, 1)$, so its leading $1$ is implicit and the 3 stored bits step by $\Delta D = 2^{-4}$: $\hat D \in \{\tfrac12, \tfrac{9}{16}, \dots, \tfrac{15}{16}\}$, 8 columns. $\beta R_i$ is signed and bounded by $\beta\rho D = \tfrac83 D < \tfrac83$, so it needs 3 integer bits including the sign; the remaining 3 are fractional, $\Delta \beta R_i = 2^{-3}$, giving a 6-bit two's-complement input covering $[-4, 4)$. The output digit lies in $\{-2,\dots,2\}$ and is carried on 3 bits in two's complement. Nine bits in, three out.

**The table is four thresholds per column, not 512 entries.** Because the wedges are ordered, a legal assignment can always be taken monotone in $\beta R_i$: pick the largest $k$ whose threshold has been crossed. Threshold $m_k(\hat D)$ separates $k-1$ from $k$ and must be placed so that every cell above it admits $k$ and every cell below admits $k-1$, over the *whole* $D$ column. Both bounds are linear in $D$, so evaluating them at the column's two endpoints is sufficient:

$$\max_{D \in [\hat D,\ \hat D + 2^{-a})} (k-\rho)D \;\le\; m_k(\hat D) \;\le\; \min_{D \in [\hat D,\ \hat D + 2^{-a})} (k-1+\rho)D$$

and $m_k$ must itself be a multiple of $2^{-b}$, since it is a grid line. For $\beta=4,\gamma=2$ at $a=3,b=6$ every one of the 32 windows contains such a multiple. In units of $2^{-3}$:

| $\hat D$ | $m_{-1}$ | $m_0$ | $m_1$ | $m_2$ |
| --- | --- | --- | --- | --- |
| $1/2$ | $-6$ | $-2$ | $2$ | $6$ |
| $9/16$ | $-7$ | $-3$ | $2$ | $7$ |
| $5/8$ | $-8$ | $-3$ | $2$ | $8$ |
| $11/16$ | $-9$ | $-3$ | $2$ | $8$ |
| $3/4$ | $-10$ | $-4$ | $3$ | $9$ |
| $13/16$ | $-10$ | $-4$ | $3$ | $10$ |
| $7/8$ | $-11$ | $-4$ | $3$ | $10$ |
| $15/16$ | $-12$ | $-5$ | $3$ | $11$ |

**Three kinds of cell, and only one of them is safe to be careless with.** A cell wholly inside one wedge has a unique digit. A cell inside the overlap of two wedges admits both — these are the ones the book prints as `1|2`, and they are genuine don't-cares for [[Karnaugh Map]]-style minimisation, which is where most of the logic reduction comes from. A cell entirely outside the convergence domain $|\beta R_i| \le \beta\rho D$ is unreachable and may be given any value at all. What is *not* a don't-care is a cell that merely straddles the domain boundary: if it contains even one reachable point it must carry a digit legal at that point.

> [!important] The Pentium FDIV bug is a threshold window that was empty
> Apply the box above at $b = 5$ instead of $6$. For the single column $\hat D \in [\tfrac{9}{16}, \tfrac58)$ the window for $m_2$ is $[0.8333,\ 0.9375]$, and it contains no multiple of $2^{-2}$ — $0.75$ is below it and $1.0$ above. The threshold does not exist, so one rectangle straddles the boundary of $S_1$ and $S_2$ belonging wholly to neither: the cell marked `!` in Fig. 9.6, p. 275, with its odd-symmetric mirror at $m_{-1}$. At 5 bits of $\beta R_i$ the selection function is not merely awkward, it does not exist. Going to 6 bits empties no window and all 512 cells become labellable.
>
> **The 1995 Pentium FDIV bug was a handful of these border cells being improperly labelled** (footnote 3, p. 275) — cells treated as don't-cares that were reachable. The algorithm was right; the table's boundary rows were wrong. Note the failure mode: the divider produced a plausible answer for almost every input, because a bad cell only fires when $\beta R_i$ lands in one narrow band with one particular $\hat D$.

**On FPGAs the table is not the expensive part — the digit encoding is.** Nine inputs and three outputs is three 9-input functions, so on 6-input LUTs each output costs a small tree rather than one cell. The book's real point is downstream: encoding the digit in two's complement on three bits as $q_{-i} = -2^2q_{-i,2} + 2^1q_{-i,1} + 2^0q_{-i,0}$ (9.31), rewritten as $q_{-i} = -4q^{\ominus}_{-i} + q^{\oplus}_{-i}$ with $q^{\ominus}_{-i} \in \{0,1\}$ and $q^{\oplus}_{-i} \in \{0,1,2,3\}$ (9.32), lets the $\{0,\pm D,\pm 2D\}$ multiplexer and the add/sub merge into a **single row of 6-input LUTs** on the fast carry chain: each LUT takes one bit of $R_i$, one of $D$, one of $2D$ and the three bits of $q_{-i}$ (p. 276). Choosing $\gamma = 2$ over $\gamma = 3$ therefore buys a cheaper *datapath* at the price of a bigger table, which is the opposite of the intuitive trade. See [[Lookup-Tables]] for the mapping rules and [[Radix-4 Maximally Redundant Divider]] for the $\gamma = 3$ side of the trade.

> [!warning] No LUT or delay figures for the selection table in the source
> Chapter 9 states the input widths and the 6-LUT packing of the *datapath*, but reports no LUT count, level count or delay for the selection function itself. Sizing it needs a synthesis run or a FloPoCo build.

$$\boxed{\ q_{-i} = \max\{\,k : \widehat{\beta R_i} \ge m_k(\hat D)\,\},\qquad \max_{D}(k-\rho)D \;\le\; m_k(\hat D) \;\le\; \min_{D}(k-1+\rho)D\ }$$

**Where it breaks.**

- **$D$ not normalized.** The wedges have vertical extent $(2\rho-1)D$ and close as $D \to 0$, so below some $D$ no fixed grid can resolve them. The table exists only for $D \in [\tfrac12, 1)$; anything else must be normalized first, which is why the P-D diagram is always clipped at $D = 1/2$.
- **One bit too few on $\beta R_i$.** Not a graceful degradation — a single empty threshold window and the function ceases to exist. Verify by the box, not by eye.
- **$\beta R_i$ kept in carry-save.** With a [[Carry-Save Partial Remainder]] the remainder is two words and its top bits are not final; a short carry-propagate assimilation of the leading bits is needed before comparison, and the selection function grows (p. 288). That growth, not the extra registers, is the cost of carry-save.
- **Higher radix.** Table area grows exponentially in $a + b$ while the iteration count only halves again, which is why radix 8 with $\gamma = 7$ is both larger and slower than either radix-4 variant on FPGAs (p. 277), and why radix-64 dividers reach for [[Divisor Prescaling]] and speculation instead of a bigger table.
- **First iteration.** With $\rho < 1$ the initialization is $R_1 = X/4$, always positive, so the first digit needs only part of the table (p. 279).
- **Generator caveat.** FloPoCo does not support don't-cares in the selection table and assigns $\pm2$ to every out-of-domain cell (p. 276), so a generated table is correct but larger than a hand-minimised one.

**The RTL is the threshold table plus a priority chain.**

```spade
/// Radix-4, gamma=2 quotient digit selection thresholds, in units of 2^-3.
/// `d` = the 3 bits of the normalised divisor below its implicit leading 1,
/// so D in [ 1/2 + d/16 , 1/2 + (d+1)/16 ).
fn thresholds(d: uint<3>) -> (int<6>, int<6>, int<6>, int<6>) {
    match d {
        0 => ( -6, -2, 2,  6),
        1 => ( -7, -3, 2,  7),
        2 => ( -8, -3, 2,  8),
        3 => ( -9, -3, 2,  8),
        4 => (-10, -4, 3,  9),
        5 => (-10, -4, 3, 10),
        6 => (-11, -4, 3, 10),
        7 => (-12, -5, 3, 11),
    }
}

/// 6 bits of the shifted remainder and 3 bits of the divisor in,
/// one signed digit in {-2,-1,0,1,2} out, as 3-bit two's complement.
entity qsel4(br: int<6>, d: uint<3>) -> int<3> {
    let (m_1, m0, m1, m2) = thresholds(d);
    if br >= m2       { 2 }
    else if br >= m1  { 1 }
    else if br >= m0  { 0 }
    else if br >= m_1 { -1 }
    else              { -2 }
}
```

`br` is the top 6 bits of $\beta R_i$ — the thick wire entering `sel` in the drawing — and `d` the 3 bits of $D$; both are the *truncated* views, not the full-width datapath signals. `thresholds` is the whole content of the table, an $8 \times 4$ constant array indexed by `d`, and the comparison cascade is the blue staircase. Everything here is combinational; in a real divider both inputs arrive from registers and the output feeds the mux/add-sub row in the same cycle, so this block sits directly on the critical path. Synthesis will not build it as written: the four comparators plus the priority chain collapse into three 9-input Boolean functions, and the `1|2` cells become don't-cares that the minimiser is free to exploit — the entity fixes one legal choice per cell, the silicon may make another.

Verified by simulation rather than by inspection: all $8 \times 64 = 512$ table entries checked exhaustively, plus 3000 random vectors and 9 named ones, against the *specification* $(k-\rho)D \le \beta R_i \le (k+\rho)D$ evaluated in exact integer arithmetic — not against a second copy of the staircase. 3521 checks, 0 failures.

**Related notes.**

- [[SRT Division]] – depends-on: this table is the `sel` block of the SRT iteration; everything else in the loop is a mux and an add/sub.
- [[Comparison-Based Digit Selection]] – compares: the non-redundant alternative, which must compare the *exact* remainder against $D$ and so cannot truncate its inputs at all.
- [[Redundant Number Systems]] – depends-on: the overlap $2\rho-1>0$ that the whole construction spends exists only because the digit set is redundant.
- [[Radix-4 Maximally Redundant Divider]] – compares: $\gamma=3$ shrinks this table to 4+1 bits but adds a $3D$ input to the multiplexer, losing the single-LUT-row packing.
- [[Carry-Save Partial Remainder]] – counter-example: makes the iteration faster but the selection function bigger, since $\beta R_i$ is no longer a single binary word.
- [[Divisor Prescaling]] – supports: pushing $D$ close to 1 narrows the range of $\hat D$ the table must cover, which is how high-radix dividers stay affordable.
- [[Lookup-Tables]] – depends-on: the 9-in/3-out function has to land on FPGA LUTs, and the digit encoding is chosen so the *datapath* fits one 6-LUT row.
- [[Karnaugh Map]] – supports: the `1|2` cells and the out-of-domain cells are the don't-cares that make the minimised table small.
- [[FloPoCo]] – supports: `flopoco FPDiv wE=8 wF=23 srt=42` generates exactly this table, though without don't-care support.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.4 redundant digit sets, redundancy factor and selection intervals, (9.27)–(9.30), pp. 272–274.
- Fig. 9.6, p. 275 — selection on 5 bits of $\beta R_i$ and 3 bits of $D$, with the unlabellable cell; **Pentium FDIV, footnote 3, p. 275**.
- Fig. 9.7, p. 276 — selection on 6 bits of $\beta R_i$ and 3 bits of $D$; digit encoding (9.31)–(9.32) and the 6-LUT packing, p. 276.
- Fig. 9.8, p. 277 — one radix-4 iteration, showing where `sel` sits; $\gamma = 3$ comparison and Fig. 9.9, pp. 277–278.
- §9.2.5 initialization $R_1 = X/4$ and the simplified first digit, p. 279.
- §9.2.9 carry-save remainder and its effect on the selection function, p. 288.
