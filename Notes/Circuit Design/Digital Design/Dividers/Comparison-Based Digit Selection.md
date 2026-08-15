---
title: "Comparison-Based Digit Selection"
description: "Selects the digit by comparing the shifted remainder in parallel against precomputed divisor multiples in the overlap regions — the only route to high-radix division of arbitrary integers, at two sequential carry propagations."
kind: circuit
source: "ASA §9.2.7, pp. 282-283"
status: seed
spade: simulated
tags: [digital, divider, srt, digit-selection, comparator, high-radix]
aliases:
  - Digit Selection by Comparison
  - Comparison-Based Quotient Digit Selection
  - Selection by Comparison with Divisor Multiples
---

# Comparison-Based Digit Selection

The SRT selection function realised as parallel magnitude comparisons of $\beta R_i$ against exact rational multiples of $D$ instead of a table lookup on truncated bits — the only variant that survives $D \to 0$, because its thresholds are rays through the origin rather than horizontal lines.

```tikz title="Radix-4 digit selection by comparison against the divisor multiples D/2 and 3D/2"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- selection wedges S_k = [(k-rho)D, (k+rho)D], rho = 2/3, drawn as rays ----
  % horizontal: D, scale 3 units per unit of D.  vertical: beta R_i, y = 2.4*slope at x=4.5
  \fill[blue!14]  (0,0) -- (4.5,3.2)  -- (4.5,6.4)  -- cycle;   % S_+2
  \fill[red!12]   (0,0) -- (4.5,0.8)  -- (4.5,4.0)  -- cycle;   % S_+1
  \fill[green!14] (0,0) -- (4.5,-1.6) -- (4.5,1.6)  -- cycle;   % S_0
  \fill[red!12]   (0,0) -- (4.5,-0.8) -- (4.5,-4.0) -- cycle;   % S_-1
  \fill[blue!14]  (0,0) -- (4.5,-3.2) -- (4.5,-6.4) -- cycle;   % S_-2
  % ---- the four overlap bands, where a threshold may legally be placed ----
  \fill[black!30] (0,0) -- (4.5,3.2)  -- (4.5,4.0)  -- cycle;
  \fill[black!30] (0,0) -- (4.5,0.8)  -- (4.5,1.6)  -- cycle;
  \fill[black!30] (0,0) -- (4.5,-0.8) -- (4.5,-1.6) -- cycle;
  \fill[black!30] (0,0) -- (4.5,-3.2) -- (4.5,-4.0) -- cycle;
  % ---- wedge boundaries ----
  \foreach \y in {6.4,4.0,3.2,1.6,0.8,-0.8,-1.6,-3.2,-4.0,-6.4}
    \draw[black!65,thin] (0,0) -- (4.5,\y);
  % ---- the comparison thresholds: rays of slope +-1/2 and +-3/2 ----
  \foreach \y in {3.6,1.2,-1.2,-3.6}
    \draw[blue!70!black,very thick,dashed] (0,0) -- (4.6,{\y*4.6/4.5});
  % ---- axes ----
  \draw[->] (0,-6.9) -- (0,7.1) node[anchor=south] {$\beta R_i$};
  \draw[->] (-0.35,0) -- (5.0,0) node[anchor=north west] {$D$};
  \draw[black!55,dashed] (1.5,-6.9) -- (1.5,7.0);
  \draw[black!55,dashed] (3.0,-6.9) -- (3.0,7.0);
  \node[anchor=north,font=\scriptsize,text=black!55] at (1.5,-6.95) {$D=\tfrac12$};
  \node[anchor=north,font=\scriptsize,text=black!55] at (3.0,-6.95) {$D=1$};
  % ---- digit labels, one per wedge ----
  \node[fill=blue!30,rounded corners=1pt,inner sep=1.6pt]  at (3.55,4.55) {$+2$};
  \node[fill=red!25,rounded corners=1pt,inner sep=1.6pt]   at (3.55,2.15) {$+1$};
  \node[fill=green!30,rounded corners=1pt,inner sep=1.6pt] at (3.55,0.32) {$0$};
  \node[fill=red!25,rounded corners=1pt,inner sep=1.6pt]   at (3.55,-2.15) {$-1$};
  \node[fill=blue!30,rounded corners=1pt,inner sep=1.6pt]  at (3.55,-4.55) {$-2$};
  % ---- threshold and boundary labels on the right ----
  \node[anchor=west,font=\scriptsize] at (4.7,4.05) {$(1{+}\rho)D=\tfrac53 D$};
  \node[anchor=west,font=\scriptsize,text=blue!70!black] at (4.7,3.62) {$\beta R_i=\tfrac32 D$};
  \node[anchor=west,font=\scriptsize] at (4.7,3.18) {$(2{-}\rho)D=\tfrac43 D$};
  \node[anchor=west,font=\scriptsize] at (4.7,1.63) {$(0{+}\rho)D=\tfrac23 D$};
  \node[anchor=west,font=\scriptsize,text=blue!70!black] at (4.7,1.21) {$\beta R_i=\tfrac12 D$};
  \node[anchor=west,font=\scriptsize] at (4.7,0.79) {$(1{-}\rho)D=\tfrac13 D$};
  \node[anchor=west,font=\scriptsize,text=blue!70!black] at (4.7,-1.21) {$\beta R_i=-\tfrac12 D$};
  \node[anchor=west,font=\scriptsize,text=blue!70!black] at (4.7,-3.62) {$\beta R_i=-\tfrac32 D$};
  % ---- annotations ----
  \node[anchor=north west,align=left,font=\scriptsize] at (4.7,6.9)
    {every boundary $\beta R_i=(k\pm\rho)D$ is a\\
     \textbf{ray through the origin}, so the\\
     picture is unchanged by scaling $D$:\\
     the thresholds stay inside the overlaps\\
     for every $D>0$, including $D<\tfrac12$\\
     where the P-D table is not defined};
  \node[anchor=north west,align=left,font=\scriptsize] at (4.7,-1.9)
    {grey bands are the overlaps\\
     $S_k\cap S_{k+1}$, height $(2\rho-1)D=\tfrac13 D$;\\
     $\tfrac12 D$ and $\tfrac32 D$ sit inside them};
  \node[anchor=north west,align=left,font=\scriptsize] at (4.7,-4.0)
    {widths: $D$ is $w_D$ bits unsigned,\\
     $3D=D+2D$ is $w_D{+}2$, $\beta R_i$ is\\
     $w_D{+}3$ signed, the digit is 3 bits.\\
     Halving is avoided by comparing\\
     $2\beta R_i$ against $D$ and $3D$.};
  \node[anchor=north west,align=left,font=\scriptsize] at (-0.4,-7.5)
    {$\beta=4$, $\gamma=2$, $\rho=\gamma/(\beta-1)=\tfrac23$. Four parallel magnitude comparisons
     against $\pm\tfrac12 D$, $\pm\tfrac32 D$ give the digit.};
\end{circuitikz}
\end{document}
```

*after Fig. 9.11, p. 283; the overlap shading and the $(k\pm\rho)D$ labels are added from (9.30).*

**The table dies because its thresholds are horizontal and the wedges are not.** In the [[Quotient Digit Selection Table]] the selection intervals are the wedges $S_k = [(k-\rho)D,\ (k+\rho)D]$ of the P-D plane, whose vertical extent — and whose overlap, of height $(2\rho-1)D$ — is *proportional to $D$*. A table indexed by the leading $b$ bits of $\beta R_i$ tiles that plane with rectangles of fixed height $2^{-b}$, and a rectangle can only be labelled if it fits inside one wedge. Below some $D$ it never does, whatever $b$ you spend. That is why the P-D diagram is clipped at $D \ge 1/2$ and why high-radix SRT is a *significand* algorithm: it cannot divide two arbitrary integers, and in particular it cannot divide by 1 (p. 282).

**Undo the failure by scaling the threshold with $D$ instead of the input.** The selection constraint (9.30) is scale-free before you multiply it back into hardware coordinates:

$$-\rho + \frac{\beta R_i}{D} \;\le\; q_{-i} \;\le\; \rho + \frac{\beta R_i}{D} \tag{9.30}$$

Only the ratio $y = \beta R_i / D$ appears, so the digit is a function of $y$ alone. Consecutive intervals $S_k = [k-\rho,\ k+\rho]$ in $y$ overlap in $[\,k+1-\rho,\ k+\rho\,]$, and a threshold separating $q=k$ from $q=k+1$ is legal anywhere in that band. Multiplying the band back by $D$ turns it into the grey wedge of the diagram, but the *choice of $c$* in a threshold $\beta R_i = cD$ is made in $y$-space and is therefore independent of $D$. A comparison against $cD$ is a straight line through the origin, which is exactly the shape the wedge boundaries have.

**The midpoint is the same rational number for every $\rho$.** Averaging the two ends of the overlap,

$$c_k \;=\; \frac{(k+1-\rho) + (k+\rho)}{2} \;=\; k + \frac12$$

— $\rho$ cancels by cancellation of $-\rho$ against $+\rho$. So the maximally safe threshold between digits $k$ and $k+1$ is always $(k+\frac12)D$, with the same margin $(\rho - \frac12)D$ on either side, $= D/6$ for radix 4 with $\gamma = 2$. For that system the thresholds are $\pm\frac12 D$ and $\pm\frac32 D$; the book picks them because they are cheap ($D/2$ is a wire, $3D/2 = D + D/2$ is one addition), and they are simultaneously the optimal placement.

**The rule is round-to-nearest on the exact quotient digit, clamped by the digit set.** Reading the thresholds off, $q_{-i} = k$ exactly when $(k-\frac12)D \le \beta R_i < (k+\frac12)D$, i.e. $|y - q_{-i}| \le \frac12$ — which is legal by (9.30) precisely because $\rho > \frac12$ in any redundant system. The clamp costs nothing: with $|R_i| \le \rho D$ the input satisfies $|y| \le \beta\rho = \frac83$, so the outermost comparisons ($\pm\frac52 D$) are simply not built, and $y = \frac83$ falls to $q = 2$ with error $\frac23 = \rho$, exactly on the invariant's bound. This identification is the whole reason [[Divisor Prescaling]] works: force $D \approx 1$ and the multiplications by $D$ vanish from the thresholds, leaving "round $\beta R_i$ to the nearest integer" — a short addition instead of four full-width comparators (p. 284).

**Never halve; double the remainder instead.** $\frac12 D$ and $\frac32 D$ are only cheap if you refuse to compute them. Multiply both sides of each comparison by 2, which preserves the inequality, and compare $2\beta R_i$ against $D$ and $3D$: the doubling is a wire, no LSB is discarded, and only $3D = D + (D \ll 1)$ costs an adder — precomputed once outside the loop, the same trade the [[Radix-4 Maximally Redundant Divider]] makes for its $3D$ multiplexer input. Widths: $D$ is $w_D$ bits unsigned, $3D$ is $w_D + 2$, $\beta R_i$ is $w_D + 3$ bits signed (from $|\beta R_i| \le \frac83 D < 4D$ plus a sign bit), $2\beta R_i$ needs $w_D + 4$, and the digit is 3 bits in the two's-complement encoding (9.32).

**Two carry propagations in sequence is the whole cost story.** A comparison is a subtraction of which only the sign is used; you can drop the hardware that forms the difference bits, but not the carry chain that produces the sign, and the sign is the *last* bit out of it. The four comparisons run in parallel, so they cost one propagation — but the digit they produce then steers the multiplexer for the update $R_{i+1} = \beta R_i - q_{-i}D$, which is a second full-width propagation. Two propagations buy $\log_2\beta = 2$ quotient bits. [[Restoring Division]] also spends two propagations on two quotient bits, using one subtractor and one mux instead of four comparators, an adder for $3D$, a 5:1 multiplexer and an add/sub. The book's verdict is that it is unclear whether any context makes this worth it (p. 282). Note the contrast with restoring: there the comparison *was* the update, and the digit fell out of the same carry chain for free; here the two are different subtractions and must be serialised.

**Where it does pay: a non-redundant digit set plus speculation.** Drop redundancy entirely — radix 8, digits $\{0,\dots,7\}$ — and compute all eight candidates $8R_i - q_iD$ in parallel with merged arithmetic, then select the first non-negative one. The sign bits form a thermometer code; a [[Priority Encoder]] on them yields $q_{-i}$ and an 8:1 multiplexer on the eight differences yields $R_{i+1}$, so the update is a value you *already computed* rather than a second subtraction. One carry propagation now buys three quotient bits, versus one bit for restoring. The bill is eight $w_D+3$-bit subtractors, the odd multiples $3D$, $5D$, $6D$, $7D$ (each an addition, hoisted out of the loop), the encoder and the mux — "a rather expensive solution" (p. 282). The same speculate-then-select shape reappears, on top of prescaling and a carry-save remainder, in [[Radix-64 Speculative Divider]].

**The rival escape is cheaper, which is why you rarely see this circuit.** The other way to handle $D$ near zero is to leave the selection function alone and fix $D$: multiply $X$ and $D$ by $2^k$ so that the MSB of $D$ is 1. That is a [[Leading Zero Counters]] on $D$ plus two shifters ([[Normalizers]]), i.e. computing a normalised floating-point representation of $D$ with $k$ as its exponent (p. 282). $Q = X/D$ is invariant under the common factor, so only the final remainder needs unscaling by $2^{-k}$. Crucially the whole cost sits **outside** the iteration — one LZC and two barrel shifts amortised over $\lceil w_Q/\log_2\beta\rceil$ cycles — whereas comparison-based selection adds a carry propagation to **every** cycle. Amortised cost beats per-iteration cost as soon as the quotient is more than a few digits long.

**On FPGA the comparators are structurally wasteful.** Each threshold is a $w_D$-wide subtraction mapped onto the hard carry chain, consuming a full row of LUTs and carry logic to deliver one bit of information; four of them deliver four bits. The radix-4 $\gamma = 2$ table, by contrast, is a 9-input function of truncated bits, and its multiplexer and add/sub merge into a single row of 6-input LUTs (p. 276). The comparison approach only becomes attractive on FPGA when the carry chains are also producing the *next remainder*, which is the radix-8 speculative arrangement above, and even then eight of them are being built for one to be used.

$$\boxed{\ q_{-i} \;=\; \operatorname{clamp}_{[-\gamma,\ \gamma]}\left\lfloor \frac{\beta R_i}{D} + \frac12 \right\rfloor \quad\text{via thresholds } \left(k+\tfrac12\right)D,\quad \text{margin } \left(\rho - \tfrac12\right)D\ }$$

**When it breaks.**

- $\rho = \frac12$ exactly (a non-redundant digit set) leaves zero margin. The rule is still *correct*, because the thresholds are exact multiples of $D$ rather than truncations — but nothing may be approximated anywhere: no truncated $\beta R_i$, no truncated $D$, no partial carry chain. That is why the radix-8 non-redundant variant compares full-width and takes its answer from a sign bit.
- A carry-save partial remainder is incompatible. The sign of a redundant number is not its MSB, so every comparison would need a full conversion first — killing the one optimisation that makes high-radix SRT fast. See [[Carry-Save Partial Remainder]]; that note's truncate-and-convert trick restores an approximation error $2^t$, which the margin $(\rho-\frac12)D$ can only absorb while $D$ stays away from zero, i.e. exactly where the table already worked.
- Cost grows linearly in $\beta$ while the iteration count only falls as $\log\beta$: a radix-$\beta$ system with $\gamma$ needs $\gamma$ comparators per sign plus the odd multiples $3D, 5D, \dots$, each an adder. Past radix 8 the crossover is against prescaling, which reduces selection to a short addition regardless of radix.
- $D = 0$ is still undefined — the technique removes the restriction $D \ge \frac12$, not the divide-by-zero check.
- The clamp is only free while $|R_i| \le \rho D$ holds on entry. Initialisation must already satisfy it ($R_1 = X/4$ for $\rho < 1$, p. 279); feed it a larger remainder and the missing outer comparators silently return a digit that violates the invariant, and the recurrence diverges without ever signalling.

> [!warning] Not covered in the source — needs outside research
> Chapter 9 gives no LUT, slice or delay figures for comparison-based selection, and no published divider is cited as using it in the redundant form. The "rarely beats restoring" conclusion is the book's own reasoning from carry-propagation counts (p. 282), not a measurement. Deciding it for a real target needs synthesis data.

**RTL (Spade).** The full radix-4 $\gamma=2$ selection cell, combinational:

```spade
/// Radix-4, gamma = 2 quotient-digit selection by comparison against divisor
/// multiples. The thresholds are +-D/2 and +-3D/2; both are realised on a
/// doubled remainder so that nothing is halved and no bit is lost.
fn qsel_cmp<#uint W>(r: int<{W + 3}>, d: uint<W>) -> int<3> {
    let dw: int<{W + 5}> = sext(d.to_int());       // D
    let d3: int<{W + 5}> = trunc(dw + (dw << 1));  // 3D = D + 2D, one addition
    let rw: int<{W + 5}> = sext(r);
    let r2 = rw << 1;                              // 2 beta R_i, pure wiring
    if r2 >= d3 { 2 }
    else if r2 >= dw { 1 }
    else if r2 >= -dw { 0 }
    else if r2 >= -d3 { -1 }
    else { -2 }
}
```

`r` is $\beta R_i$, the vertical coordinate of the diagram, at $w_D+3$ bits signed; `d` is $D$, the horizontal one. `d3` is the one adder hoisted out of the loop, and `r2` is the doubling that replaces both halvings — in synthesis it is a shifted wire, not a shifter. The four `>=` are the four dashed rays: they are independent and synthesise as four parallel carry chains, whereas the `else if` chain draws them as a priority ladder. What synthesis will *not* reproduce from the drawing is the sharing: only the sign of each subtraction is used, so the difference bits are dead logic and get swept, leaving four carry chains and a 4-to-3 encoder. The cell is one iteration's selection only; the update $R_{i+1} = \beta R_i - q_{-i}D$ and the $\lceil w_Q/2\rceil$-cycle loop control sit outside it.

`qsel_cmp::<8>` was simulated on 14783 vectors — every legal $(\beta R_i, D)$ pair for $D \in [1, 63]$, 4000 random pairs across the full 8-bit divisor range, and named asymmetric cases including $(\beta R_i, D) = (1, 128)$, $(-1, 128)$, $(2, 1)$ and $(\pm 680, 255)$, the last being $|\beta R_i| = \beta\rho D$ exactly. The reference is not a second copy of the if-chain but the invariant itself: $3\,|\beta R_i - q_{-i}D| \le 2D$, i.e. $|R_{i+1}| \le \rho D$. No failures; perturbing any one threshold makes thousands of vectors fail.

**Related Notes.**

- [[Quotient Digit Selection Table]] – counter-example: the table this replaces, and the exact reason it cannot be built for small $D$.
- [[SRT Division]] – depends-on: supplies the digit set, $\rho = \gamma/(\beta-1)$ and the constraint (9.30) that makes any of these thresholds legal.
- [[Divisor Prescaling]] – extends: the same round-to-nearest rule with $D$ forced to $\approx 1$, so the multiplications by $D$ disappear.
- [[Magnitude Comparator]] – depends-on: each threshold is one, sign output only, and its carry chain is half the critical path.
- [[Priority Encoder]] – depends-on: turns the eight sign bits of the non-redundant radix-8 variant into the digit.
- [[Radix-64 Speculative Divider]] – extends: speculate-all-candidates-then-select at full scale, stacked with prescaling and carry-save.
- [[Leading Zero Counters]] – compares: the rival escape from small $D$, paid once instead of every iteration.
- [[Normalizers]] – supports: the two shifters that apply the $2^k$ the leading zero count produces.
- [[Restoring Division]] – compares: the same two carry propagations per two quotient bits, for a fraction of the area.
- [[Carry-Save Partial Remainder]] – counter-example: removes the update's carry propagation but destroys the sign test every comparison here relies on.
- [[Radix-4 Maximally Redundant Divider]] – compares: also precomputes $3D$ outside the loop, and pays for it in the multiplexer instead of in comparators.
- [[Choosing a Divider]] – compares: where in the family an integer divider with unnormalised $D$ actually lands.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.7 "High-Radix Integer Division", pp. 282–283: both escapes from $D \approx 0$, the two-carry-propagation critical path, the comparison against restoring, the non-redundant radix-8 variant with priority encoder and 8:1 multiplexer, and normalisation by a leading zero counter and two shifters. Fig. 9.11, p. 283.
- §9.2.4–9.2.5 selection constraint (9.30), redundancy factor (9.29), overlap width $2\rho-1$, digit encoding (9.32), initialisation $R_1 = X/4$: pp. 273–279.
- §9.2.8 "Prescaling", selection by rounding once $D_{\text{scaled}} \approx 1$, Fig. 9.12b, p. 284.
