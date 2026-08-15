---
title: SRT Division
description: "Redundant digit set turns quotient digit selection into a small table read — radix-4 with digits -2..2 needs only a mux, a shift and an add/sub, packing into one row of 6-LUTs."
kind: circuit
source: "ASA §9.2.4-9.2.5, pp. 272-282"
status: seed
spade: simulated
tags: [digital, dividers, digit-recurrence, redundant, fpga]
aliases:
  - SRT
  - SRT Divider
  - SRT Division
  - Sweeney-Robertson-Tocher Division
  - Radix-2 SRT
---

# SRT Division

The digit-recurrence division of [[Restoring Division]] run with a *signed redundant* quotient digit set, which is exactly enough slack that the digit can be chosen from a handful of leading bits instead of by a comparison against the true remainder.

```tikz title="One iteration of a radix-4 SRT divider with digit set -2 to +2, and the register that closes the loop"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- primary inputs -------------------------------------------------
  \draw (-2.5,6.6) -- (-2.5,0.2);
  \node[anchor=south] at (-2.5,6.62) {$R_i$};
  \node[anchor=west]  at (-2.4,6.05)  {$w_R$};
  \draw (4.5,6.6) -- (4.5,2.3);
  \node[anchor=south] at (4.5,6.62) {$D$};
  \node[anchor=west]  at (4.6,6.05)  {$w_F{+}1$};
  % --- taps into the selection function --------------------------------
  \draw (-2.5,5.4) -- (-6.2,5.4) -- (-6.2,4.2);
  \node[anchor=south] at (-4.4,5.42) {6 MSBs of $\beta R_i$};
  \draw (4.5,5.0) -- (-5.6,5.0) -- (-5.6,4.2);
  \node[anchor=south] at (1.0,5.02) {3 MSBs of $D$};
  \draw (-7.2,3.2) rectangle (-5.0,4.2);
  \node at (-6.1,3.7) {\textsf{sel}};
  % --- quotient digit --------------------------------------------------
  \draw (-6.1,3.2) -- (-6.1,-0.3) -- (-5.6,-0.3);
  \node[anchor=west] at (-6.0,2.7) {$q_{-i}$, 3 bits};
  \node[circ] at (-6.1,1.2) {};
  \draw (-6.1,1.2) -- (-0.7,1.2);
  % --- shifted remainder ----------------------------------------------
  \node[anchor=west] at (-2.4,3.6) {$\ll 2$};
  \node[anchor=west] at (-2.4,3.1) {$\beta R_i$, $w_R$};
  % --- multiple selection multiplexer ----------------------------------
  \draw (-1.0,1.5) -- (5.2,1.5) -- (4.6,0.9) -- (-0.4,0.9) -- cycle;
  \node at (2.1,1.2) {\textsf{mux} $|q_{-i}|$};
  \draw (-0.4,1.5) -- (-0.4,1.95);
  \node[anchor=south] at (-0.4,1.97) {$0$};
  \draw (4.5,2.3) -- (2.1,2.3) -- (2.1,1.5);
  \node[anchor=east] at (2.0,1.85) {$D$};
  \draw (4.5,2.7) -- (4.9,2.7) -- (4.9,1.5);
  \node[circ] at (4.5,2.7) {};
  \node[circ] at (4.5,5.0) {};
  \node[circ] at (-2.5,5.4) {};
  \node[anchor=west] at (5.0,1.85) {$D{\ll}1$};
  \draw (2.1,0.9) -- (2.1,0.2);
  \node[anchor=west] at (2.2,0.55) {$|q_{-i}|D$, $w_R$};
  % --- add / subtract --------------------------------------------------
  \draw (-5.6,-0.8) rectangle (3.4,0.2);
  \node[anchor=west] at (-5.5,-0.3) {$\pm$};
  \node at (-0.6,-0.3) {\textsf{add/sub}};
  \draw (-1.1,-0.8) -- (-1.1,-1.8);
  \node[anchor=west] at (-1.0,-0.95) {$w_R$};
  \node[anchor=north] at (-1.1,-1.82) {$R_{i+1} = \beta R_i - q_{-i}D$};
  % --- loop closure ----------------------------------------------------
  \draw[dashed] (-1.1,-1.3) -- (-7.75,-1.3);
  \draw[dashed] (-8.2,-1.0) -- (-8.2,6.3) -- (-2.5,6.3);
  \node[circ] at (-2.5,6.3) {};
  \draw (-8.65,-1.6) rectangle (-7.75,-1.0);
  \node at (-8.2,-1.3) {\textsf{reg}};
  \node[anchor=north,align=center] at (-1.1,-2.5)
    {loop runs $k=\lceil (w_F{+}3)/\alpha\rceil$ times for $\beta=2^{\alpha}$\\
     no multiplier: $|q_{-i}|D \in \{0,\pm D,\pm 2D\}$ is a shift and a sign\\
     \textsf{sel} reads 3 bits of $D$ and 6 bits of $\beta R_i$, nothing else};
\end{circuitikz}
\end{document}
```

*after Fig. 9.8, p. 277, with the selection widths of Fig. 9.7, p. 276; the dashed register closing the loop is my addition — the book's figure shows the combinational step alone.*

**Start from the recurrence that already works.** Writing $X$ in $k$ radix-$\beta$ digits, set $R_0 = \beta^{-k}X$ and

$$R_{i+1} = \beta R_i - q_{k-i-1}D \tag{9.15--9.16}$$

Unrolling by repeated substitution, with $\beta$ distributing over the subtraction at every step, gives $R_i = \beta^i R_0 - \big(\sum_{j<i}\beta^j q_{k-i+j}\big)D$, so at $i=k$ we have $X = QD + R_k$ with $Q = \sum_j \beta^j q_j$. The recurrence is correct *by construction*; the entire difficulty is choosing $q$.

**The tight invariant leaves no room to guess.** Imposing $0 \le R_i < D$ (9.24) forces $q_{k-i-1} = \lfloor \beta R_i / D\rfloor$ (9.25): by the induction hypothesis $0 \le \beta R_i/D < \beta$, so the floor is a legal digit, and multiplying $0 \le \beta R_i/D - q < 1$ by $D>0$ (order-preserving) closes the induction. But that floor **is a division**, and the intervals of $\beta R_i$ on which successive digits are legal abut with zero overlap, so their boundary is a single exact point — you must know $\beta R_i$ to the last bit.

**Buy slack by adding digits.** Take the signed digit set of [[Redundant Number Systems]],

$$\mathcal{D} = \{-\gamma,\dots,\gamma\}, \qquad \gamma \ge \beta/2 \tag{9.27}$$

which holds at least $\beta+1$ values for a radix of $\beta$, and relax the invariant to something symmetric, $|R_i| \le \rho D$ (9.28). Preservation is a worst-case argument: $\beta R_i$ is at most $\beta\rho D$ and the largest digit is $\gamma$, so $\beta\rho D - \gamma D \le \rho D$ requires $\rho(\beta-1)\le\gamma$. Larger $\rho$ is better, because $\rho$ *is* the slack, so take the **redundancy factor**

$$\rho = \frac{\gamma}{\beta-1} \tag{9.29}, \qquad \rho > \tfrac12 \ \text{ since } \gamma \ge \beta/2$$

**Read the invariant as an interval per digit.** Substituting $R_{i+1} = \beta R_i - q_{-i}D$ into (9.28) and dividing by $D>0$,

$$-\rho + \frac{\beta R_i}{D} \;\le\; q_{-i} \;\le\; \rho + \frac{\beta R_i}{D} \tag{9.30}$$

Turned around: digit $k$ is legal for every scaled remainder $y = \beta R_i/D$ in $S_k = [k-\rho,\,k+\rho]$, an interval of width $2\rho$ centred on $k$. Consecutive intervals overlap iff $k+\rho \ge (k+1)-\rho$, i.e. $2\rho\ge1$, and the overlap has width $2\rho-1$, strictly positive exactly because $\gamma\ge\beta/2$.

> [!important] The overlap is the entire product
> Everything SRT buys is the width $2\rho-1$ of that overlap. If you compute only an approximation $\hat y$ with $|y-\hat y|\le\varepsilon$ and decide the digit by comparing $\hat y$ against fixed thresholds, that is safe as long as every uncertainty band fits inside some $S_k$ — thresholds can be placed anywhere in the overlap, so such a placement exists whenever $\varepsilon < 2\rho-1$. More redundancy $\Rightarrow$ wider overlap $\Rightarrow$ coarser $\hat y$ $\Rightarrow$ smaller selection table. Every later trick ([[Carry-Save Partial Remainder]], [[Divisor Prescaling]]) is a different way of spending the same budget.

**Radix 2 with $\{-1,0,+1\}$ is the degenerate case worth memorising.** Here $\gamma = 1 = \beta-1$, so $\rho = 1$ — maximally redundant, overlap $2\rho-1 = 1$, a full digit wide. With normalised $\hat D \in [\tfrac12,1)$ the rule collapses to: $q_{-i}=+1$ if $2R_i \ge \tfrac12$, $-1$ if $2R_i < -\tfrac12$, else $0$. Check the middle case against (9.30): $q=0$ needs $|2R_i|\le\hat D$, and $|2R_i|<\tfrac12\le\hat D$ holds. **The rule reads three bits of $2R_i$ and no bits of $D$ at all** — that is the overlap being spent, and it is why radix-2 SRT needs no table, only a sign and a shift.

**Radix 4 with $\gamma = 2$ is the FPGA sweet spot.** Now $\rho = 2/3$ and overlap $1/3$, so selection needs 6 bits of $\beta R_i$ and 3 bits of $D$ (Fig. 9.7, p. 276). The digit product $q_{-i}D \in \{0,\pm D,\pm 2D\}$ is a multiplexer and a one-bit shift — no multiplier anywhere in the loop. Encoding the digit in two's complement on three bits as $q_{-i} = -4q^{\ominus}_{-i} + q^{\oplus}_{-i}$ (9.32) lets the multiplexer and the add/sub merge into a **single row of 6-input LUTs** (p. 276), which is the whole reason this variant wins on FPGA. Going to $\gamma = 3$ shrinks the table to 4 bits of $\beta R_i$ and 1 bit of $D$ but adds a $3D$ input to the mux, breaking that packing — see [[Radix-4 Maximally Redundant Divider]]. On ASIC the balance is different: the add/sub is no longer LUT-cheap, so the pressure moves to shortening it rather than to shrinking the table.

**Widths.** $D$ is the $w_F{+}1$-bit significand; $R_i$ is $w_R$ bits and, by construction, the three leading bits of the add/sub result are all copies of the sign, so two of them need not be computed and $R_{i+1}$ comes out the same width as $R_i$ (caption of Fig. 9.8, p. 277). The digit bus is $\lceil\log_2\beta\rceil + 1$ bits in the $(q^{\ominus}, q^{\oplus})$ encoding — 3 for radix 4.

**Initialisation and termination.** Convergence needs (9.28) true from the first iteration. For a maximally redundant system ($\gamma = \beta-1$, $\rho = 1$) $R_1 = X/2$ works; otherwise $\tfrac12 < \rho \le 1$ and $R_1 = X/4$ is required, the quotient being scaled back by the same factor (p. 279). Unrolling the significand recurrence gives the *exact* identity

$$\frac{R_1}{D} = Q_i + \beta^{-i}\frac{R_{i+1}}{D} \tag{9.33--9.34}$$

and since $|R_{i+1}/D| \le \rho$ by the invariant, $|R_1/D - Q_i| \le \rho\beta^{-i}$ (9.35). Stop when that drops below the target: a correctly rounded floating-point quotient needs $w_F+3$ bits, so $k = \lceil (w_F+3)/\alpha\rceil$ iterations at radix $2^\alpha$. Because (9.34) is an identity and not an approximation — nothing was rounded anywhere — the final rounding is a *decision* made on $R_{k+1}$, not an error to be bounded (p. 280). See [[Error Accuracy]] for what "correctly rounded" costs elsewhere.

**Loop control is not free.** One iteration is a mux, an add/sub and a small table; the loop around it is a $w_R$-bit register for $R$, a counter, and the machinery that assembles $k$ signed digits into a binary quotient. Done naively that assembly is one final carry-propagate subtraction over the whole quotient (9.36–9.37); done with [[On-the-Fly Quotient Conversion]] it is pure wiring, at the cost of two muxes and two quotient-width registers per stage.

$$\boxed{\ R_{i+1} = \beta R_i - q_{-i}D,\quad |R_i| \le \rho D,\ \ \rho = \frac{\gamma}{\beta-1} \ \Longrightarrow\ \text{selection intervals overlap by } 2\rho-1 > 0\ }$$

## When it breaks

- **$D$ near zero.** The selection wedges have vertical extent $(2\rho-1)D$, so they close as $D\to 0$ and no fixed-size table exists. High-radix SRT therefore cannot divide two arbitrary integers directly; $D$ must be normalised first, or prescaled ([[Divisor Prescaling]]).
- **Boundary cells of the table.** A rectangle of the truncated $(D, \beta R_i)$ grid that straddles two wedges cannot be labelled at all, and a rectangle touching the convergence domain is *not* a don't-care even if it looks like one. The 1995 Pentium FDIV bug was exactly this — a handful of border cells labelled as though they were don't-cares (footnote 3, p. 275). See [[Quotient Digit Selection Table]].
- **Approximating $\beta R_i$ eats the budget twice.** Keeping $R_i$ in carry-save form removes carry propagation from the loop but forces a truncated estimate $\beta\widetilde R_i = \beta R_i + \delta$, $\delta \in \{0, -2^t\}$, which consumes $2^t/D$ of the overlap. At $t=-4$, 6 bits of $\beta\widetilde R_i$ and 3 bits of $D$ are no longer sufficient (Fig. 9.14, p. 287).
- **Latency is linear in $w_F$.** $k$ iterations at one add/sub each. Past single precision the multiplicative family ([[Division by Reciprocal]], [[Goldschmidt Division]]) converges quadratically and takes over, provided a multiplier is already on the die.
- **Higher radix stops paying.** Radix 8 with $\gamma = 7$ exists in FloPoCo and is both larger and slower than either radix-4 variant (p. 277).

## RTL (Spade)

One iteration of the radix-2, $\{-1,0,+1\}$ recurrence — the case whose selection function is small enough to write in full. Fixed point on $W$ bits, one sign and one integer bit, so the stored integer represents $x/2^{W-2}$; preconditions $\tfrac12 \le d < 1$ and $|r| \le d$ are the invariant (9.28) with $\rho = 1$.

```spade
/// One iteration of radix-2 SRT with digit set {-1, 0, +1}.
/// Fixed point on W bits, one sign + one integer bit: value = x / 2^(W-2).
/// Preconditions: 1/2 <= d < 1 and |r| <= d, both maintained by the recurrence.
entity srt2_step<#uint W>(r: int<W>, d: int<W>) -> (int<2>, int<W>) {
    let r2: int<W> = r <<. 1;
    // The three leading bits of 2R_i, read as a signed integer: t = floor(2 * 2R_i).
    let sh: int<W> = W - 3;
    let t: int<W> = r2 >>> sh;
    let q: int<2> = if t >= 1 { 1 } else { if t <= -2 { -1 } else { 0 } };
    let rn: int<W> = match q {
        1  => r2 -. d,
        -1 => r2 +. d,
        _  => r2,
    };
    (q, rn)
}
```

`r2` is the $\ll 1$ on the $R_i$ bus of the diagram (the drawing shows $\ll 2$ because it is radix 4); the truncating `<<.` keeps $W$ bits, which is safe because $|2R_i| \le 2D < 2$ still fits one sign plus one integer bit. `t` is the `sel` box: an arithmetic right shift by $W-3$ leaves exactly the three leading bits of $2R_i$, sign-extended, so comparing it against the constants $1$ and $-2$ is the rule "$q=+1$ if $2R_i \ge \tfrac12$, $-1$ if $2R_i < -\tfrac12$" with no bits of `d` consulted at all. The `match` is the mux and the add/sub fused — at radix 2 the mux degenerates to $\{0, D\}$ and a sign, so synthesis emits one $W$-bit adder with an inverted-operand path, not the three-input mux of the drawing. Everything here is combinational: the register and the counter that make it a divider live outside, and $k = W-2$ instantiations of this body in time produce $W-2$ signed digits.

Verified with `srt2_step::<16>`, then simulated by closing the loop in the testbench and feeding $R_{i+1}$ back for 14 steps: 3008 divisions (42,106 single-iteration evaluations) all satisfying the invariant $|R_{i+1}| \le D$ and the exact identity $2^k X = QD + R_{k+1}$, over a random sweep of normalised $d \in [2^{13}, 2^{14})$ and $0 \le x \le d$ plus asymmetric named vectors ($x=1, d=8192$; $x=1, d=16383$; $x=d$). The worked example $\hat X = 0.10110101_2$, $\hat D = 0.1101_2$ reproduces the digit string $(1,1,1,0,0,0,0,\bar1)$, i.e. $Q_8 = 0.11011111_2$, exactly.

## Related Notes

- [[Restoring Division]] – compares: the same recurrence under the tight invariant $0 \le R_i < D$, where the digit costs a trial subtraction and a possible undo.
- [[Non-Restoring Division]] – compares: already uses digits $\{-1,+1\}$, but without the $0$ that makes the intervals overlap, so it still needs the sign of the exact remainder.
- [[Redundant Number Systems]] – depends-on: supplies the signed digit set $\{-\gamma..\gamma\}$ whose redundancy factor $\rho$ is the whole design knob.
- [[Quotient Digit Selection Table]] – extends: tiles the $(D,\beta R_i)$ plane and turns the overlap into the actual LUT, boundary cells and all.
- [[Radix-4 Maximally Redundant Divider]] – extends: $\gamma = 3$, $\rho = 1$, a far smaller table bought with a $3D$ mux input.
- [[On-the-Fly Quotient Conversion]] – supports: assembles the signed digits into binary by concatenation only, removing the final carry propagation from the latency.
- [[Carry-Save Partial Remainder]] – extends: spends the overlap budget on a redundant $R_i$, taking carry propagation out of the loop entirely.
- [[Carry-Save Adder]] – supports: the adder form that redundant $R_i$ requires inside the recurrence.
- [[Lookup-Tables]] – supports: the 6-input LUT that the radix-4, $\gamma=2$ selection and add/sub pack into, which is why that variant wins on FPGA.
- [[Booth's Algorithm]] – compares: the multiplier-side use of the same signed-digit recoding, where redundancy buys fewer partial products instead of a cheaper decision.
- [[FloPoCo]] – supports: generates these dividers directly, the radix and $\gamma$ selected by the `srt=` argument (`flopoco FPDiv wE=8 wF=23 srt=43` for $\beta=4$, $\gamma=3$).
- [[Choosing a Divider]] – compares: where the digit-recurrence family sits against the multiplicative one.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 9 "Fixed-Point Division".

- §9.2.3 the radix-$\beta$ digit recurrence and its invariant, (9.14)–(9.26), pp. 268–271.
- §9.2.4 redundant digit sets, redundancy factor and selection intervals, (9.27)–(9.32), Figs. 9.5–9.9, pp. 272–278; naming after Sweeney, Robertson [Rob58] and Tocher [Toc58], p. 272; Pentium FDIV, footnote 3, p. 275; architecture of one radix-4 step, Fig. 9.8, p. 277.
- §9.2.5 initialisation and termination with redundant digits, (9.33)–(9.35), pp. 279–280.
- §9.2.6 conversion of the quotient from redundant form, (9.36)–(9.37), pp. 280–282.
- §9.2.9 carry-save partial remainder and its effect on selection, (9.44)–(9.45), Fig. 9.14, pp. 286–287.
