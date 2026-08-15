---
title: "Non-Restoring Division"
description: "Removes the restore multiplexer by letting the remainder go negative — one add/sub per digit, controlled by the previous remainder's sign bit, paid for with one correction iteration."
kind: circuit
source: "ASA §9.2.1, p. 267 fn. 2 and Fig. 9.4, p. 269; §9.2.4, pp. 272-274"
status: seed
spade: simulated
tags: [digital, dividers, digit-recurrence, redundant, fpga]
aliases:
  - "Non-Restoring Division"
  - "Nonrestoring Division"
  - "Non-Restoring Divider"
  - "Non-Restoring Division Recurrence"
---

# Non-Restoring Division

The radix-2 digit recurrence with digit set $\{-1,+1\}$: the partial remainder is allowed to go negative and the next iteration repairs it by adding instead of subtracting, so the restore multiplexer disappears and each iteration is exactly one add-or-subtract.

```tikz title="One iteration of non-restoring division: the sign bit of the previous remainder is the only control"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,x=0.82cm,y=0.82cm,>=latex]
  %% ---------- state register ----------
  \draw[thick] (5.6,9.2) rectangle (9.4,10.1);
  \node at (7.5,9.65) {\textsf{reg} $R_i$};
  \node[anchor=west,font=\footnotesize] at (9.5,9.65) {$w_D{+}1$, two's compl.};

  %% ---------- sign-bit tap: the entire control of the iteration ----------
  \draw[red,thick] (6.2,9.2) -- (6.2,8.75) -- (4.4,8.75);
  \draw[red,thick,->] (4.4,8.75) -- (3.2,8.75);
  \node[anchor=east,font=\footnotesize,align=right,text=red] at (3.15,8.75)
    {$q_{-i}=\pm1$\\ 1 bit};
  \draw[red,thick] (4.4,8.75) -- (4.4,3.9);
  \node[anchor=west,font=\footnotesize,text=red] at (4.45,6.95) {$\mathrm{sign}(R_i)$};
  \node[anchor=west,font=\footnotesize,text=red] at (4.45,4.35) {$c_{\mathrm{in}}$};

  %% ---------- shift: 2 R_i with one new bit of X ----------
  \draw (7.5,9.2) -- (7.5,8.3);
  \draw (5.6,7.4) rectangle (9.4,8.3);
  \node at (7.5,7.85) {$\ll 1$};
  \draw[->] (11.2,7.85) -- (9.4,7.85);
  \node[anchor=west,font=\footnotesize] at (11.25,7.85) {$x_{w_X-1-i}$};
  \draw[thick] (7.5,7.4) -- (7.5,3.9);
  \node[anchor=west,font=\footnotesize] at (7.55,5.6) {$2R_i$, $w_D{+}2$};

  %% ---------- divisor: zero-extend, then conditional invert ----------
  \draw[->] (0.8,10.4) -- (0.8,6.7);
  \node[anchor=south,font=\footnotesize] at (0.8,10.45) {$D$, $w_D$ (zero-ext.\ to $w_D{+}2$)};
  \draw (-0.8,5.8) rectangle (2.4,6.7);
  \node at (0.8,6.25) {\textsf{invert row}};
  \draw[red,thick] (4.4,6.25) -- (2.4,6.25);
  \draw[thick] (0.8,5.8) -- (0.8,3.9);
  \node[anchor=west,font=\footnotesize] at (0.85,4.7) {$w_D{+}2$};

  %% ---------- the single add ----------
  \draw[red,thick] (-0.8,3.0) rectangle (9.4,3.9);
  \node at (6.2,3.45) {\textsf{add} ($w_D{+}2$)};
  \draw[thick] (7.5,3.0) -- (7.5,1.5);
  \node[anchor=west,font=\footnotesize] at (7.55,2.75) {$w_D{+}2 \to w_D{+}1$ (trunc)};
  \node[anchor=north] at (7.5,1.45) {$R_{i+1} = 2R_i - q_{-i}D$};

  %% ---------- feedback ----------
  \draw (7.5,2.0) -- (-2.6,2.0) -- (-2.6,11.4) -- (7.5,11.4) -- (7.5,10.1);
  \node[anchor=south,font=\footnotesize] at (3.0,11.45) {next cycle};

  %% ---------- annotation ----------
  \node[anchor=north west,align=left,font=\footnotesize,text=red] at (-2.6,0.9)
    {Critical path (red): one carry propagation, and nothing after it.\\
     The $\pm$ control is the sign bit of the \emph{previous} remainder, so it\\
     is stable before this cycle's carry chain starts. No restore mux.};
  \node[anchor=north west,align=left,font=\footnotesize] at (-2.6,-1.1)
    {Subtract $=$ invert row $+$ $c_{\mathrm{in}}{=}1$, both driven by that one bit:\\
     $q_{-i}=+1 \Rightarrow$ subtract $D$, \quad $q_{-i}=-1 \Rightarrow$ add $D$.};
\end{circuitikz}
\end{document}
```

*own construction; the shift-and-subtract skeleton and its widths follow Fig. 9.4, p. 269, with the restore multiplexer removed per footnote 2, p. 267.*

**Delete the restore step by relaxing the invariant.** [[Restoring Division]] holds $0 \le R_i < D$ (9.24), and enforces it by computing $2R_i - D$, testing its sign, and multiplexing the old remainder back in when the test fails. Non-restoring keeps the same recurrence but replaces the invariant by the symmetric one of (9.28) with redundancy factor $\rho = \gamma/(\beta-1) = 1$ (9.29):

$$-D \;\le\; R_i \;\le\; D, \qquad q_{-i} \in \{-1,+1\}, \qquad R_{i+1} = 2R_i - q_{-i}D$$

There is no $q_{-i}=0$ to fall back on, so the recurrence *must* move: it either subtracts $D$ or adds $D$, never nothing. That is precisely why no restore path exists — there is no "do nothing" case to undo.

**The identity that makes overshooting harmless.** Suppose restoring rejects a step: $2R_i - D < 0$, so it sets $q=0$, keeps $R_{i+1} = 2R_i$, and the *next* iteration evaluates $2(2R_i) - D = 4R_i - D$. Non-restoring instead keeps the negative value $R_{i+1} = 2R_i - D$, sees its sign, and adds:

$$2\,(2R_i - D) + D \;=\; 4R_i - 2D + D \;=\; 4R_i - D$$

by distributivity of multiplication over subtraction. The two machines are in the *same state* after two iterations. The quotient bookkeeping agrees too, because at weights $2^k$ and $2^{k-1}$

$$(+1)\cdot 2^{k} + (-1)\cdot 2^{k-1} \;=\; 2^{k-1} \;=\; 0\cdot 2^{k} + (+1)\cdot 2^{k-1}$$

so the signed-digit pair $(+1,-1)$ *is* the binary pair $(0,1)$. Non-restoring is not an approximation of restoring; it is the same computation with the correction deferred by one step and absorbed into an operation it had to perform anyway.

**Why the selection function is one bit and why that bit must be exact.** Apply the selection-interval argument of [[Redundant Number Systems]]: dividing $-\rho D \le R_{i+1} \le \rho D$ through by $D > 0$ (order-preserving), digit $k$ is legal exactly when $y = 2R_i/D$ lies in $S_k = [\,k-\rho,\,k+\rho\,]$. With $\rho = 1$, $S_{+1} = [0,2]$ and $S_{-1} = [-2,0]$, whose union is the whole reachable range $[-2,2]$ — so $q_{-i} = \operatorname{sign}(R_i)$ is always a legal choice, reading **zero bits of $D$ and one bit of $R_i$**.

> [!note] The zero digit is what buys the overlap, and non-restoring does not have it
> Consecutive digits here are $2$ apart while each interval is only $2\rho = 2$ wide, so $S_{-1}$ and $S_{+1}$ merely *touch*, at the single point $y=0$. Overlap width is $2\rho - 1$ only when the digit set is contiguous; deleting $0$ from $\{-1,0,+1\}$ collapses it to a point. A point boundary means no approximation $\hat y$ is admissible — the sign bit must be the *true* sign, which forces a carry-propagate adder and rules out a carry-save remainder. Restoring the $0$ digit is exactly what [[SRT Division]] does, and exactly what it spends the overlap on.

**Widths, end to end.** $D$ is $w_D$ bits unsigned with $D > 0$. The invariant bounds $R_i$ to $[-D, D-1]$ in the integer alignment, so $R_i$ is $w_D+1$ bits two's complement — one more than $D$, and the extra bit is the sign, not magnitude. Shifting left and pulling in one bit of $X$ gives $2R_i + x_{w_X-1-i}$ in $[-2D, 2D-1]$, needing $w_D+2$ bits, which is the adder width; $D$ is zero-extended to match. The sum lands back in $[-D, D-1]$ by the invariant, so truncating the adder output from $w_D+2$ to $w_D+1$ discards a bit that is provably a sign copy. Restoring's adder is $w_D+1$ (Fig. 9.4, p. 269); non-restoring's is one bit wider because the shifted remainder is genuinely signed and genuinely doubled.

**The signed-digit quotient converts to binary with no adder at all.** Encode the digit as one bit $b_i = [\,q_{-i} = +1\,]$ — the inverted sign bit, which is what the datapath already produces. Substituting $q_{-i} = 2b_i - 1$ into $Q = \sum_{i=0}^{w_Q-1} q_{-i}2^{w_Q-1-i}$ and using $\sum_i 2^{w_Q-1-i} = 2^{w_Q}-1$ (geometric sum):

$$Q \;=\; 2\!\!\sum_{i=0}^{w_Q-1}\! b_i 2^{w_Q-1-i} \;-\; (2^{w_Q}-1) \;=\; 2B + 1 - 2^{w_Q}, \qquad B = (b_0b_1\ldots b_{w_Q-1})_2$$

In hardware: shift the collected sign-bit string left by one, force a $1$ into the LSB, and drop bit $w_Q$. Wires and a constant. Check it against the worked example $181 \div 13$ on $w_Q=8$, whose digits are $(+1,-1,-1,-1,-1,+1,+1,-1)$: $B = 10000110_2 = 134$, $2B+1 = 269 = 100001101_2$, drop bit 8 $\Rightarrow 00001101_2 = 13$. ✓ This is the degenerate case of [[On-the-Fly Quotient Conversion]]; the general machinery is unnecessary because a two-element digit set carries no redundancy to resolve.

**The correction iteration, and why only half of it costs anything.** After $w_Q$ iterations $X = QD + R_{w_Q}$ holds by construction, but $R_{w_Q}$ may be negative, in which case the Euclidean condition $0 \le R < D$ (9.23) is violated and the fix is $R \leftarrow R + D$, $Q \leftarrow Q - 1$ (footnote 2, p. 267). The remainder half costs one more $w_D+2$-bit add — the "$+1$" in the $w_Q+1$ latency. The quotient half is free: $Q = 2B + 1 - 2^{w_Q}$ is *always odd*, so $Q-1$ clears the bottom bit and never borrows. One AND gate, no carry chain.

**Where the target decides the trade.** Per iteration, restoring costs one $w_D+1$ subtract *then* a $w_D$-wide multiplexer steered by the subtract's MSB — two logic depths in series, because the sign bit arrives last. Non-restoring costs one $w_D+2$ add whose $\pm$ control was registered a cycle earlier, so the carry chain starts immediately: one logic depth. On ASIC this buys nothing measurable, because the mux is a couple of gates against a carry chain that dominates either way (p. 267 fn. 2). On FPGAs with small LUTs it does buy something, and for a structural reason: the restore mux is a LUT *per bit* placed after the carry chain, outside the hardened fast-carry path, whereas non-restoring's conditional invert is absorbed into the LUT that already feeds the carry chain's input — a row of XORs that the adder's LUT computes for free.

> [!warning] The source gives no LUT counts or delays for any divider
> Chapter 9 is architectural throughout: iteration counts, selection-function input widths, error budgets, no synthesis results. The FPGA-versus-ASIC claim above is the book's own assertion (p. 267 fn. 2) plus the structural reason; the crossover width, and whether it survives on a modern device, needs measurement or a FloPoCo run.

$$\boxed{\ q_{-i} = \operatorname{sign}(R_i) \in \{-1,+1\},\qquad R_{i+1} = 2R_i - q_{-i}D,\qquad \text{latency } w_Q + 1\ }$$

**Where it breaks.** Five corner cases, in the order they bite:

- **The remainder is wrong until corrected.** Unlike restoring, whose $R_i$ is a valid remainder at every step, non-restoring's is only Euclidean after the final $+D$. Any early-exit or truncate-the-iterations scheme must pay the correction first, which matters because exact $R$ is the whole reason to pick a digit recurrence over [[Division by Reciprocal]].
- **No carry-save remainder.** The selection boundary is the point $R_i = 0$, so the sign must be exact. Keeping $R_i$ in [[Carry-Save Partial Remainder|carry-save]] makes the sign unavailable without assimilating, which is the carry propagation you were trying to remove. Radix-2 SRT with the $0$ digit is the smallest change that fixes this.
- **No shift-over-zeros.** Digit $0$ does not exist, so a long run of $2R_i \approx 0$ still costs one add each — non-restoring cannot skip iterations the way an SRT recurrence with a $0$ digit can when $D$ is close to a power of two.
- **Latency is linear in $w_Q$ and the constant is a full carry chain.** Past roughly 32 bits on FPGA the fast carry chain stops being cheap and the argument for radix 2 collapses entirely; go high-radix (see [[Choosing a Divider]]). Unrolling in space does not help delay in either variant — it only buys throughput through pipelining (p. 267).
- **Requires $D > 0$ and a valid start.** $R_0$ must satisfy the invariant ($R_0 = 0$ with $X$ shifted in bit by bit, or $R_1 = X/2$ for normalized significands, (9.26)); $D = 0$ has no defined behaviour and must be trapped upstream.

**Express the recurrence body in RTL.** One iteration, not the operator: the register holds $R_i$, the combinational block produces $R_{i+1}$ and the digit bit, and a counter runs the entity $w_Q+1$ times.

```spade
/// One iteration of radix-2 non-restoring division.
/// `load` restarts the recurrence at R_0 = 0; `xbit` is the next dividend bit,
/// MSB first. Returns (R_i, q_i) with q_i = true meaning the digit +1.
entity nr_step<#uint W>(
    clk: clock,
    load: bool,
    d: uint<W>,
    xbit: bool,
) -> (int<{W + 1}>, bool) {
    decl next;
    reg(clk) r: int<{W + 1}> reset(load: 0) = next;

    // q_{-i} = sign(R_i): non-negative remainder => subtract D.
    let q = !r.sign_bit();

    // 2 R_i with one new bit of X shifted into the LSB.
    let rs: int<{W + 2}> = sext(r);
    let xu: uint<{W + 2}> = zext(xbit.as_uint());
    let sh: int<{W + 2}> = (rs << 1) +. xu.as_int();

    // conditional invert: the one bit q drives both the XOR row and c_in
    let dz: uint<{W + 2}> = zext(d);
    let pm: int<{W + 2}> = if q { -dz.as_int() } else { dz.as_int() };

    let next: int<{W + 1}> = trunc(sh +. pm);
    (r, q)
}
```

`r` is the register at the top of the diagram, `sh` the $\ll 1$ block, `pm` the invert row, and `sh +. pm` the single red adder — `+.` because the invariant guarantees the $w_D+2$-bit sum needs no growth bit, and `trunc` back to $w_D+1$ discards a provable sign copy. Everything but `r` is combinational, so one call of this entity is one clock cycle. Synthesis will not build `-dz` as a negater: it recognises the `if` over $\pm D$ as an XOR row plus a carry-in and folds both into the adder's own LUT row, which is the whole FPGA argument above.

**Cost of the loop around it.** $w_Q$ iterations plus one correction cycle. Control is a $\lceil \log_2(w_Q+1) \rceil$-bit down-counter, a terminal comparator, the `load` path on `r`, and one $w_Q$-bit shift register — the same one, because $X$ vacates a bit from the top at exactly the rate digit bits arrive at the bottom. No mux in the datapath, which is the point.

**Related notes.**

- [[Restoring Division]] – compares: the same recurrence with $0$ in the digit set, paying a $w_D$-wide restore mux per bit and a second logic depth per cycle.
- [[SRT Division]] – extends: puts the $0$ digit back to turn the touching selection intervals into overlapping ones, which is what makes an approximate selection function legal.
- [[Redundant Number Systems]] – supports: the digit set, redundancy factor $\rho = \gamma/(\beta-1)$ and selection-interval argument used above.
- [[Ripple-Carry Adder]] – depends-on: the single add/sub per iteration is one carry chain, and its delay *is* the cycle time.
- [[Carry-Save Adder]] – counter-example: the one adder this recurrence cannot use, because an exact sign is not readable from a redundant remainder.
- [[On-the-Fly Quotient Conversion]] – compares: the general signed-digit-to-binary machinery, which a $\{-1,+1\}$ digit set collapses into a shift and a bit-clear.
- [[Choosing a Divider]] – compares: where non-restoring sits against every sibling in latency, area and rounding guarantee.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.1 restoring division, (9.11)–(9.13), Fig. 9.4 (one-step hardware), pp. 269–269; **non-restoring, footnote 2, p. 267** — the ASIC/FPGA verdict and the extra correction iteration.
- §9.2.2 radix-$\beta$ formalization and the invariant $0 \le R_i < D$, (9.15)–(9.25), pp. 269–271.
- §9.2.3 normalized-significand alignment $R_1 = X/2$, (9.26), p. 271.
- §9.2.4 redundant digit sets, redundancy factor (9.27)–(9.30), pp. 272–274.
