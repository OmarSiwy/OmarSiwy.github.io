---
title: "Digit-Recurrence Cube Root"
description: "Same recurrence one degree up, with the partial square built by a parallel recurrence so no multiplier appears; twice as slow and twice as small as the multiplier-based cube root, and correctly rounded for free."
kind: circuit
source: "ASA §19.2, pp. 588-589"
status: seed
spade: simulated
tags: [digital, digit-recurrence-for-algebraic-functions, cube-root, algebraic, iterative]
aliases:
  - Cube Root
  - Cube Root Digit Recurrence
  - Radix-2 Cube Root
---

# Digit-Recurrence Cube Root

A one-digit-per-cycle cube root that keeps the exact residual $W_i = \beta^i(M - S_i^3)$, distinguished from every other digit recurrence in this topic by needing the *square* of the partial result inside its own recurrence — which it obtains from a second recurrence rather than from a multiplier.

```tikz title="One iteration of the radix-2 cube-root digit recurrence: residual, partial root, and the parallel square recurrence that replaces the multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---------- tier 1: state registers ----------
  \draw (-9.6,6.4) rectangle (-4.4,7.2);
  \node at (-7.0,6.8) {$W_i$ reg (carry-save)};
  \node at (-7.0,7.55) {$2\times(n{+}5)$ bits, \texttt{sfix(4,-n)}};

  \draw (-3.4,6.4) rectangle (1.4,7.2);
  \node at (-1.0,6.8) {$S_i \;|\; S_i^{\ominus}$ on-the-fly regs};
  \node at (-1.0,7.55) {$2\times(n{+}1)$ bits, \texttt{ufix(0,-n)}};

  \draw (2.6,6.4) rectangle (7.8,7.2);
  \node at (5.2,6.8) {$Q_i = S_i^2$ reg};
  \node at (5.2,7.55) {$2n{+}2$ bits, \texttt{ufix(1,-2n)}};

  % ---------- tier 2: selection + the two side updates ----------
  \draw (-9.6,4.8) rectangle (-5.8,5.6);
  \node at (-7.7,5.2) {$\mathrm{Sel}(\widetilde{W_i})$};

  \draw (-3.4,4.8) rectangle (1.4,5.6);
  \node[align=center] at (-1.0,5.2) {on-the-fly update\\$S_{i+1}=S_i+2^{-i-1}d$};

  \draw (2.6,4.8) rectangle (7.8,5.6);
  \node[align=center] at (5.2,5.2) {square recurrence\\$Q_{i+1}=Q_i+2^{-i}dS_i+2^{-2i-2}d^2$};

  % W tap into Sel
  \draw[->] (-8.6,6.4) -- (-8.6,5.6);
  \node[anchor=west] at (-8.5,6.0) {$\widetilde{W_i}$: 5 MSDs};

  % ---------- tier 3: digit-by-number products ----------
  \draw (-9.6,2.4) rectangle (0.2,3.2);
  \node at (-4.7,2.8) {digit-by-number muxes: $3dQ_i$ \quad $3\cdot2^{-i-1}d^2S_i$ \quad $2^{-2i-2}d^3$};

  % ---------- tier 4: compression ----------
  \draw (-9.6,1.0) rectangle (0.2,1.8);
  \node at (-4.7,1.4) {four 4:2 rows $+$ one 3:2 row \;$\Rightarrow$\; $W_{i+1}$ carry-save};

  % digit bus, y = 4.3, clear of every box
  \draw[->] (-7.7,4.8) -- (-7.7,3.2);
  \draw (-7.7,4.3) -- (5.2,4.3);
  \draw[->] (-1.0,4.3) -- (-1.0,4.8);
  \draw[->] (5.2,4.3) -- (5.2,4.8);
  \node[anchor=south west] at (-7.6,4.35) {$d_{-i-1}\in\{-1,0,1\}$, 2 bits};

  % S_i tap down into the mux row (crosses the digit bus, no junction)
  \draw (1.4,6.8) -- (2.0,6.8) -- (2.0,3.7) -- (-2.2,3.7);
  \draw[->] (-2.2,3.7) -- (-2.2,3.2);
  \node[anchor=south] at (0.6,3.75) {$S_i$, $n{+}1$};

  % Q_i tap down into the mux row
  \draw (7.8,6.8) -- (8.6,6.8) -- (8.6,2.8) -- (0.8,2.8);
  \draw[->] (0.8,2.8) -- (0.2,2.8);
  \node[anchor=south] at (4.4,2.85) {$Q_i$, $2n{+}2$};

  % 2 W_i into the compressor, down the far-left lane
  \draw (-9.6,6.8) -- (-10.3,6.8) -- (-10.3,1.4);
  \draw[->] (-10.3,1.4) -- (-9.6,1.4);
  \node[anchor=south,rotate=90] at (-10.4,4.0) {$2W_i$};

  % W_{i+1} feedback lane
  \draw (0.2,1.4) -- (0.9,1.4) -- (0.9,0.0) -- (-11.2,0.0) -- (-11.2,6.8);
  \draw[->] (-11.2,6.8) -- (-9.6,6.8);
  \node[anchor=north] at (-4.7,-0.05) {$W_{i+1}$, $2\times(n{+}5)$ --- no carry propagation on this path};

  % S / Q writebacks
  \draw (-3.4,5.2) -- (-3.9,5.2) -- (-3.9,6.8);
  \draw[->] (-3.9,6.8) -- (-3.4,6.8);
  \draw (7.8,5.2) -- (9.4,5.2) -- (9.4,6.8);
  \draw[->] (9.4,6.8) -- (7.8,6.8);
\end{circuitikz}
\end{document}
```

*Own construction; the compressor counts and the 5-MSD selection width are the radix-2 figures of §19.2, p. 589. The chapter prints no block diagram for the cube root.*

**Lift the residual one degree and the derivation is unchanged.** Input is $M \in [1,8)$ — three octaves, because a cube root divides the exponent by three, so [[Square Root Range Reduction]] here reduces the exponent modulo 3 instead of modulo 2. Then $\sqrt[3]{M}\in[1,2)$, the leading digit is again free, $d_0=1$ and $S_0=1$, and the partial result after $i$ iterations is $S_i = \sum_{j=0}^{i}\beta^{-j}d_{-j}$. The error $S_i - \sqrt[3]{M}$ is not computable inside the algorithm — the exact root is what we are looking for — so, exactly as in [[Non-Restoring Square Root]], measure it through the defining polynomial instead, which is legitimate precisely because $\sqrt[3]{\cdot}$ is algebraic:

$$W_i = \beta^i\left(M - S_i^3\right)$$

**Expanding the cube gives three correction terms where the square root had two.** Substitute $S_{i+1} = S_i + \beta^{-i-1}d$, writing $d$ for $d_{-i-1}$, into $W_{i+1}=\beta^{i+1}(M-S_{i+1}^3)$ and expand by the binomial theorem:

$$\left(S_i+\beta^{-i-1}d\right)^3 = S_i^3 + 3\beta^{-i-1}dS_i^2 + 3\beta^{-2i-2}d^2S_i + \beta^{-3i-3}d^3$$

Distributing $\beta^{i+1}$ over the four resulting terms and collapsing $\beta^{i+1}(M - S_i^3)$ to $\beta W_i$ by the definition of $W_i$:

$$W_{i+1} = \beta W_i \;-\; 3\,d\,S_i^2 \;-\; 3\beta^{-i-1}d^2S_i \;-\; \beta^{-2i-2}d^3$$

Division has one correction term ($dD$, with $D$ a constant known before iteration 0), the square root has two, the cube root has three. That is the derivative structure of $x^k$: degree $k$ contributes $k$ corrections whose weights fall by a further $\beta^{-i-1}$ each, so all but the leading one decay geometrically in $i$ — the same decay that lets one selection function serve every iteration past some $i_0$.

**The multiplier hides inside $S_i^2$, and a second recurrence evicts it.** The leading correction multiplies the digit by the *square* of a value that is itself only half-built. Do not compute it; maintain it. Let $Q_i = S_i^2$ be a register of its own; squaring $S_{i+1}=S_i+\beta^{-i-1}d$ gives a recurrence of exactly the same shape,

$$Q_{i+1} = Q_i + 2\beta^{-i-1}dS_i + \beta^{-2i-2}d^2$$

two digit-by-number products and one short addition. With $Q_i$ in hand every term of $W_{i+1}$ is a digit times a register, and multiplying by a digit of $\{-\gamma,\dots,\gamma\}$ is a multiplexer plus a conditional negation. The factor 3 is free as well: by distributivity over $3 = 2+1$, $3X = (X\!\ll\!1) + X$, one extra row into the compressor rather than a multiply. This is the note's whole point — a *cubic* algebraic function computed with no multiplier anywhere in the datapath.

**Widths follow from the redundancy bound, and only $Q$ grows quadratically.** Digits come from $\{-\gamma,\dots,\gamma\}$ with redundancy factor $\rho = \gamma/(\beta-1)$, a property of the number system alone ([[Number Formats]]), so the invariant $|S_i - \sqrt[3]{M}| \le \rho\beta^{-i}$ carries over from [[Square Root Digit Selection Function]] untouched. Convert it into a bound on $W_i$ with the factorisation $a^3-b^3=(a-b)(a^2+ab+b^2)$, taking $a=\sqrt[3]{M}$ and $b=S_i$:

$$W_i = \beta^i\left(\sqrt[3]{M} - S_i\right)\left(M^{2/3} + S_iM^{1/3} + S_i^2\right)$$

The first factor is at most $\rho\beta^{-i}$ in magnitude, cancelling the $\beta^i$; the second is at most $3\cdot 2^2 = 12$ because both $\sqrt[3]{M}$ and $S_i$ stay below 2. So $|W_i| \le 12\rho$, and for radix 2 with $\gamma=1$, $\rho=1$: four integer bits plus sign, `sfix(4,-n)`, $n+5$ bits — doubled to $2(n+5)$ because $W$ is held carry-save. $S_i \in [1,2)$ is `ufix(0,-n)`, $n+1$ bits, held twice for the [[On-the-Fly Converter]]. $Q_i = S_i^2 \in [1,4)$ is `ufix(1,-2n)`, $2n+2$ bits — the widest register in the design, and the price of the multiplier-free trick.

**Selection reads five digits and nothing else.** As for division and square root, the digit is chosen by imposing on every intermediate $W_i$ the constraint expected of the *final* remainder; redundancy is what makes a truncated view of $W_i$ sufficient to enforce it. Piñeiro et al.'s radix-2 study with $\{-1,0,1\}$ shows the decision needs only the **5 most significant digits of $W_i$**, so carry propagation inside an iteration is confined to those five positions and the rest of the residual never propagates at all. The resulting iteration is **four 4:2 compressor rows, one 3:2 compressor row, and four multiplexers** for the digit-by-number products ([[Compressor Trees]]).

**Against a multiplier the area-time product is a wash and the rounding is a rout.** Under the same ASIC models, by the same team, the digit recurrence is **twice as slow but twice as small** as a multiplier-based cube root — comparable area-time, which the book offers as a rule of thumb for digit recurrences generally. The tie is broken by the last bit. Because the recurrence carries the remainder explicitly, the sign of the final residual *is* the round decision, so correct rounding is direct. A multiplier-based [[Polynomial Approximation]] returns a faithful result only, and deciding which side of the midpoint it landed on requires **cubing** the candidate — a full-width cube, on the critical path, after the fast part has already finished. That is likely to void the whole latency advantage, which is why the slower kernel survives.

> [!important] Correct rounding here is not a rounding mode bolted on at the end; it is a consequence of carrying an exact residual. Every algorithm in this topic gets it for that reason, and every multiplier-based approximator lacks it for that reason.

**On FPGAs the redundant residual is the least obviously right decision.** Carry-save exists to keep the per-iteration addition off the critical path, but FPGA fast-carry logic makes a plain two's-complement add of $n+5$ bits cheap — the same argument that led the reference [[E-Method]] implementation to keep its partial remainders non-redundant. Redundancy also doubles the $W$ register, spending flip-flops that a hardened carry chain would not. The counterweight is that the $3dQ_i$ term is $2n+2$ bits wide, which is exactly where a carry chain hurts most, so the trade does not obviously reverse either.

> [!warning] Not covered in the source — needs outside research
> §19.2 gives no LUT, slice, delay or gate counts, no radix above 2, and no FPGA implementation. The "2× slower, 2× smaller" figure is an ASIC-model comparison quoted from Piñeiro et al. with no absolute numbers attached, and the FPGA paragraph above is an inference from the square-root and E-method sections of the same chapter, not a measured result.

$$\boxed{\ \begin{aligned} W_{i+1} &= \beta W_i - 3\,d_{-i-1}S_i^2 - 3\beta^{-i-1}d_{-i-1}^2S_i - \beta^{-2i-2}d_{-i-1}^3\\[2pt] Q_{i+1} &= Q_i + 2\beta^{-i-1}d_{-i-1}S_i + \beta^{-2i-2}d_{-i-1}^2, \qquad Q_i \equiv S_i^2\ \end{aligned}\ }$$

**When it breaks.** $M$ must be pre-scaled into $[1,8)$, and the exponent reduction is modulo 3, so the range-reduction stage needs a divide-by-three of the exponent and a three-way significand shift rather than the square root's two-way one — cheap, but not the same block. The $Q$ register grows as $2n$ while everything else grows as $n$, so past roughly $n=32$ the square recurrence and not the residual path is what sets the area, and a shared multiplier is worth re-costing. The $\beta^{-2i-2}d^3$ term drops below the ulp of $W$ once $2i+2 > n$, so the back half of the iterations can discard it and shed a compressor row. And the premise fails outright when the requirement is throughput rather than latency: one digit per cycle cannot be pipelined faster than its own recurrence, so a pipelined polynomial evaluator wins on sustained rate however badly it loses on the last bit.

**One iteration in Spade.** This is the **binary restoring** specialisation — digit set $\{0,1\}$, non-redundant residual, so the digit is a comparison rather than a truncated-selection LUT — which is what can be compiled *and checked numerically*. The redundant $\{-1,0,1\}$ version drawn above replaces `rb >= k` with a 5-MSD selection function and keeps `r` carry-save, changing nothing else structurally. Working at integer scale (multiply the whole recurrence through by $\beta^{3i}$) turns $\beta W_i$ into $8r$ and consumes three new radicand bits per digit, while $3S_i^2+3S_i+1$ becomes $12q + 6s + 1$ — four shifts and three additions.

```spade
// one iteration of the binary restoring cube-root digit recurrence
entity cbrt_iter(clk: clock, start: bool, b: uint<3>) -> (uint<8>, bool) {
    decl r_next, s_next, q_next;
    reg(clk) r: uint<18> = r_next;   // residual, integer-scaled W_i
    reg(clk) s: uint<8>  = s_next;   // partial root S_i
    reg(clk) q: uint<16> = q_next;   // parallel recurrence holding Q_i = S_i^2

    let rc: uint<22> = if start { 0 } else { zext(r) };
    let sc: uint<22> = if start { 0 } else { zext(s) };
    let qc: uint<22> = if start { 0 } else { zext(q) };

    // beta^3 * W_i, plus the three new radicand bits
    let rb: uint<22> = (rc << 3) | zext(b);
    // 3 S^2 + 3 S + 1 at integer scale: shifts and adds only, no multiplier
    let k: uint<22> = (qc << 3) +. (qc << 2) +. (sc << 2) +. (sc << 1) +. 1;

    let d = rb >= k;
    let r_next: uint<18> = trunc(if d { rb -. k } else { rb });
    let s_next: uint<8>  = trunc((sc << 1) +. zext::<1, 22>(d.as_uint()));
    let q_next: uint<16> = trunc((qc << 2) +. (if d { (sc << 2) +. 1 } else { 0 }));

    (s_next, d)
}
```

`r`, `s`, `q` are the three registers along the top of the diagram, `k` is the digit-by-number mux row collapsed into its $d=1$ case, and `rb -. k` is the compressor row. $q' = 4q + d(4s+1)$ is the parallel square recurrence: the one place $s$ appears quadratically, and it is a multiplexer, not a product. Widths are the integer-scale forms of the diagram's — 18 bits because $|W| < 3s^2+3s+1$ peaks at $s = 255$, 16 for $q = s^2$, 22 for the intermediate $8r+b$; Spade's shifts do not widen, which is safe here only because those bounds are checked. Synthesis will flatten the `+.` chain into a single carry chain, which the drawing deliberately does not: the drawing is the redundant version, where that chain does not exist.

An $n$-bit root takes **$n$ iterations**, one more if round-to-nearest is wanted from the final remainder's sign. Loop control is a $\lceil\log_2(n+1)\rceil$-bit counter, a 3-bit-wide feeder slicing the radicand from the top, and the load muxes visible as `if start` — three of them, of widths $n+5$, $n+1$ and $2n+2$. Those muxes sit in series with the compressor on the recurrence's critical path every single cycle, and that, not the counter, is what "iterative" actually costs.

**Related notes.**

- [[Non-Restoring Square Root]] – extends: the identical residual-through-the-defining-polynomial argument one degree lower, with two correction terms instead of three.
- [[SRT Square Root]] – compares: same redundant digit set and carry-save residual; the cube root inherits its selection machinery wholesale.
- [[Square Root Digit Selection Function]] – depends-on: supplies the $\rho = \gamma/(\beta-1)$ bound and the truncated-view argument that makes 5 MSDs enough here.
- [[On-the-Fly Converter]] – depends-on: converts the redundant $S_i$ to binary without a per-iteration subtraction, unchanged from the square root.
- [[Square Root Range Reduction]] – depends-on: the same exponent split, modulo 3 instead of modulo 2, to land $M$ in $[1,8)$.
- [[Squarers and Integer Powers]] – counter-example: the dedicated-squarer optimisation is unavailable here, because the square is extended incrementally rather than ever computed.
- [[Compressor Trees]] – supports: the four 4:2 rows and one 3:2 row that sum the recurrence's terms without carry propagation.
- [[Polynomial Approximation]] – compares: faster and faithful, but certifying correct rounding costs a cubing that erases the advantage.
- [[SRT Division]] – compares: the degree-1 ancestor, where the multiplicand is a constant and the P-D diagram is drawn once.
- [[Choosing a Digit Recurrence]] – compares: where this sits against every sibling in the topic.
- [[Error Accuracy]] – supports: the faithful-versus-correctly-rounded distinction the whole comparison turns on.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §19.2 *Cube Root*, Eqs. (19.49)–(19.53); radix-2 selection width, compressor and multiplexer counts, and the area-time comparison against a multiplier-based implementation — pp. 588–589.
- §19.1.5 *Exploiting redundant number systems*, for the $\rho = \gamma/(\beta-1)$ bound and the truncated-residual selection argument reused here unchanged — pp. 580–586.
- §19.1.5.4 *On-the-fly conversion of $S_i$*, Eqs. (19.45)–(19.48), including the FPGA-versus-ASIC remark — pp. 587–588.
- §19.4, p. 594, for the E-method implementation that keeps its residuals in two's complement on FPGA.
- Fig. 7.21, p. 181, for the 4:2 compressor the iteration is built from.

Primary sources cited by the chapter for this section: Takagi (2001) for the general algorithm, Piñeiro et al. (2008) for the radix-2 implementation study and the comparison.
