---
title: "On-the-Fly Quotient Conversion"
description: "Converts the signed-digit quotient to binary using concatenation only, by carrying a pre-decremented copy alongside it — kills the final carry-propagate subtraction for two muxes and two registers per stage."
kind: circuit
source: "ASA §9.2.6, pp. 280-282"
status: seed
spade: simulated
tags: [digital, divider, srt, redundant, conversion, fpga]
aliases:
  - On-the-Fly Conversion
  - OTF Quotient Conversion
  - On-the-fly conversion to binary
  - Pre-Decremented Quotient Register
---

# On-the-Fly Quotient Conversion

A digit-serial converter that turns a signed-digit quotient into two's-complement binary as the digits arrive, using only multiplexers and concatenation, by maintaining a second register holding the quotient minus one ulp so that a negative digit can be absorbed by selection instead of by borrow propagation.

```tikz title="One iteration of radix-2 on-the-fly quotient conversion"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % ---- multiplexers ----
  \draw (2.5,2.2) rectangle (3.4,3.8); \node at (2.95,3.0) {2:1};
  \draw (2.5,-0.8) rectangle (3.4,0.8); \node at (2.95,0.0) {2:1};

  % ---- shift-in blocks ----
  \draw (4.5,2.4) rectangle (6.1,3.6); \node at (5.3,3.0) {$\ll 1\,\Vert\,\bar z$};
  \draw (4.5,-0.6) rectangle (6.1,0.6); \node at (5.3,0.0) {$\ll 1\,\Vert\,z$};

  % ---- registers ----
  \draw (7.2,2.4) rectangle (8.7,3.6); \node at (7.95,3.0) {$Q$};
  \draw (7.2,-0.6) rectangle (8.7,0.6); \node at (7.95,0.0) {$Q^{\ominus}$};
  \draw (7.2,2.4) -- (7.45,2.55) -- (7.2,2.7);
  \draw (7.2,-0.6) -- (7.45,-0.45) -- (7.2,-0.3);
  \node[anchor=north] at (7.95,-0.7) {\texttt{clk}};

  % ---- mux outputs ----
  \draw[-latex] (3.4,3.0) -- (4.5,3.0);
  \draw[-latex] (3.4,0.0) -- (4.5,0.0);
  \draw[-latex] (6.1,3.0) -- (7.2,3.0);
  \draw[-latex] (6.1,0.0) -- (7.2,0.0);
  \node[anchor=south] at (3.95,3.05) {$w$};
  \node[anchor=south] at (3.95,0.05) {$w$};
  \node[anchor=south] at (6.65,3.05) {$w$};
  \node[anchor=south] at (6.65,0.05) {$w$};

  % ---- feedback buses ----
  \draw (8.7,3.0) -- (9.5,3.0) -- (9.5,4.5) -- (1.8,4.5) -- (1.8,0.5);
  \draw (8.7,0.0) -- (10.1,0.0) -- (10.1,-2.0) -- (1.1,-2.0) -- (1.1,2.5);
  \draw (1.8,3.5) -- (2.5,3.5);
  \draw (1.8,0.5) -- (2.5,0.5);
  \draw (1.1,2.5) -- (2.5,2.5);
  \draw (1.1,-0.5) -- (2.5,-0.5);
  \filldraw (1.8,3.5) circle (2pt);
  \filldraw (1.1,-0.5) circle (2pt);
  \node[anchor=south] at (5.6,4.55) {$Q_{i-1}$ \ ($w$)};
  \node[anchor=north] at (5.6,-2.05) {$Q^{\ominus}_{i-1}$ \ ($w$)};

  % ---- port labels on the muxes ----
  \node[anchor=south] at (2.15,3.55) {$Q$};
  \node[anchor=south] at (2.15,2.55) {$Q^{\ominus}$};
  \node[anchor=south] at (2.15,0.55) {$Q$};
  \node[anchor=south] at (2.15,-0.45) {$Q^{\ominus}$};

  % ---- digit control ----
  \draw[-latex] (2.95,1.4) -- (2.95,2.2); \node[anchor=west] at (3.05,1.55) {$d^{-}$};
  \draw[-latex] (2.95,1.4) -- (2.95,0.8); \node[anchor=west] at (3.05,1.05) {$d^{+}$};
  \draw (0.2,1.4) -- (2.95,1.4);
  \node[anchor=east] at (0.15,1.4) {digit $q_{-i}$};
  \filldraw (2.95,1.4) circle (2pt);
  \draw (1.4,1.4) -- (1.4,1.9) -- (5.3,1.9);
  \draw[-latex] (5.3,1.9) -- (5.3,2.4);
  \draw[-latex] (5.3,1.9) -- (5.3,0.6);
  \filldraw (1.4,1.4) circle (2pt);
  \filldraw (5.3,1.9) circle (2pt);
  \node[anchor=south] at (4.7,1.95) {$z$};
\end{circuitikz}
\end{document}
```

*Own construction; the recurrence drawn is (9.41)–(9.43), p. 282, specialised to $\beta = 2$. $z = \overline{d^{+} \vee d^{-}}$ is "the digit is zero"; $d^{+}, d^{-}$ come straight out of the [[Quotient Digit Selection Table]].*

**Price the thing you are trying to avoid.** [[SRT Division]] delivers its result as a signed-digit string $Q = \sum_i \beta^{-i} q_{-i}$ with $q_{-i} \in \{-\gamma, \dots, \gamma\}$, which is not a binary number — see [[Redundant Number Systems]]. The cheap conversion splits each digit into a borrow bit and a magnitude, $q_{-i} = -\beta\, q^{\ominus}_{-i} + q^{\oplus}_{-i}$, and then uses distributivity of the sum over the two terms:

$$Q = \sum_j \beta^{j}\big(-\beta q^{\ominus}_j + q^{\oplus}_j\big) \;=\; -\beta\sum_j \beta^{j} q^{\ominus}_j \;+\; \sum_j \beta^{j} q^{\oplus}_j \tag{9.36--9.37}$$

Both sums are plain concatenations of bits that the digit selector already produced, so the entire conversion is *one* $w$-bit subtraction, where $w$ is the quotient width. Cheap in area — one [[Ripple-Carry Adder]] — but it is a full carry propagation bolted onto the end of a loop that was carefully designed to have none, and at $w = 53$ that single subtraction can cost as much as several iterations of the recurrence itself (p. 281).

**Try to do it incrementally, and find the one obstruction.** Accumulate instead, one digit at a time:

$$Q_0 = 0, \qquad Q_i = Q_{i-1} + \beta^{-i} q_{-i} \;=\; Q_{i-1} + \beta^{-i}\big(q^{\oplus}_{-i} - \beta\,q^{\ominus}_{-i}\big) \tag{9.38--9.40}$$

This only helps if every one of those additions is *mere concatenation*; a single carry propagation anywhere in the loop and you have gained nothing over one final subtraction. And it almost is. Since $Q_{i-1}$ is a multiple of $\beta^{-(i-1)}$, every digit position below $\beta^{-(i-1)}$ in $Q_{i-1}$ is zero, so adding $\beta^{-i} q^{\oplus}_{-i}$ with $0 \le q^{\oplus}_{-i} < \beta$ writes into empty space — it is $Q_{i-1} \Vert q^{\oplus}_{-i}$, wiring. The obstruction is the borrow term $-\beta^{-i+1} q^{\ominus}_{-i}$: subtracting one unit at weight $\beta^{-i+1}$ from $Q_{i-1}$ can ripple all the way to the MSB.

**Precompute the only borrow that can ever be needed.** There is exactly one value that borrow can produce, and it depends only on $Q_{i-1}$, not on the digit. So compute it in advance: maintain, alongside $Q_i$, a **pre-decremented** copy

$$Q^{\ominus}_i = Q_i - \beta^{-i}$$

Then $Q^{\ominus}_{i-1} = Q_{i-1} - \beta^{-i+1}$ *is* the borrowed value, already sitting in a register, and a negative digit is served by selecting it instead of by propagating anything. The whole trick is that a subtraction whose operand is known one cycle early is not a subtraction, it is a multiplexer. What remains is to show $Q^{\ominus}$ can itself be maintained by concatenation, which is the content of (9.41)–(9.43), p. 282:

$$
q_{-i} > 0:\ \begin{cases}Q_i = Q_{i-1} \Vert q^{\oplus}_{-i}\\ Q^{\ominus}_i = Q_{i-1}\Vert(q^{\oplus}_{-i}-1)\end{cases}
\quad
q_{-i} = 0:\ \begin{cases}Q_i = Q_{i-1}\Vert 0\\ Q^{\ominus}_i = Q^{\ominus}_{i-1}\Vert(\beta-1)\end{cases}
\quad
q_{-i} < 0:\ \begin{cases}Q_i = Q^{\ominus}_{i-1}\Vert q^{\oplus}_{-i}\\ Q^{\ominus}_i = Q^{\ominus}_{i-1}\Vert(q^{\oplus}_{-i}-1)\end{cases}
$$

**Check that $q^{\oplus}_{-i} - 1$ never borrows either** — otherwise the recursion has merely moved the problem. For $q_{-i} > 0$ the split gives $q^{\ominus}_{-i} = 0$ and $q^{\oplus}_{-i} = q_{-i} \in \{1,\dots,\gamma\}$, so $q^{\oplus}_{-i} - 1 \in \{0,\dots,\gamma-1\}$, a legal digit. For $q_{-i} < 0$ it gives $q^{\ominus}_{-i} = 1$ and $q^{\oplus}_{-i} = q_{-i} + \beta \in \{\beta-\gamma,\dots,\beta-1\}$, so $q^{\oplus}_{-i} - 1 \ge \beta - \gamma - 1 \ge 0$ exactly when $\gamma \le \beta - 1$. That is the definition of a legal redundant digit set, maximal redundancy $\gamma = \beta-1$ being the tight case. So on-the-fly conversion works at every radix and every digit set SRT can use — it is not a radix-2 accident.

**Collapse the three cases into two muxes.** Reading the table column-wise rather than case-wise, both outputs have the same shape "select a base, append a digit":

| | base of $Q_i$ | appended to $Q_i$ | base of $Q^{\ominus}_i$ | appended to $Q^{\ominus}_i$ |
|---|---|---|---|---|
| $q_{-i} > 0$ | $Q_{i-1}$ | $q^{\oplus}_{-i}$ | $Q_{i-1}$ | $q^{\oplus}_{-i}-1$ |
| $q_{-i} = 0$ | $Q_{i-1}$ | $0$ | $Q^{\ominus}_{i-1}$ | $\beta-1$ |
| $q_{-i} < 0$ | $Q^{\ominus}_{i-1}$ | $q^{\oplus}_{-i}$ | $Q^{\ominus}_{i-1}$ | $q^{\oplus}_{-i}-1$ |

The base of $Q_i$ is chosen by $d^{-} = [q_{-i} < 0]$ alone; the base of $Q^{\ominus}_i$ by $d^{+} = [q_{-i} > 0]$ alone. At radix 2 the appended digits degenerate to single bits — $\bar z$ for $Q$ and $z$ for $Q^{\ominus}$, where $z = \overline{d^{+} \vee d^{-}}$ — which is what the diagram draws. Per iteration: two $w$-bit 2:1 multiplexers, two $w$-bit registers, one inverter (p. 282). No adder, no carry, no dependence of the delay on $w$.

**Widths, and the trap in the initial value.** $Q$ and $Q^{\ominus}$ are $w$ bits each, $w$ being the target quotient width; the digit is $\lceil \log_2(2\gamma+1)\rceil$ bits, encoded as the pair $(d^{+}, d^{-})$ plus magnitude, of which the converter uses only the low $\lceil\log_2\beta\rceil$ bits of $q^{\oplus}_{-i}$ and the two flags. In hardware the registers hold the *scaled* value $\beta^{i} Q_i$ — a left-shifting register whose low $i$ bits are live at step $i$ — which is why the drawing shows $\ll 1$ and not a position-indexed write. That scaling makes $Q^{\ominus}_0 = -1$, not representable as an unsigned $w$-bit number. It is nevertheless the right reset value: all three update rules are affine in the register contents with integer coefficients, so they commute with reduction mod $2^{w}$, and initialising $Q^{\ominus}$ to all-ones gives the correct answer at step $k$ whenever the true $Q_k \ge \beta^{-k}$ — which SRT guarantees for a positive quotient. Reset $Q$ to $0$ and $Q^{\ominus}$ to $\overline{0}$ and the leading-digit special case disappears.

**Loop control is where the real cost hides, and it is not in this block.** At radix $2^{\alpha}$ a correctly rounded significand needs $k = \lceil (w_F+3)/\alpha \rceil$ iterations (p. 271), so the control is a $\lceil \log_2 k\rceil$-bit down-counter plus a done flag — negligible. What matters is *which* implementation style you pay for. In a **folded** divider, one digit per cycle, the converter is one instance: $2w$ registers and two $w$-bit muxes, total, and it sits entirely off the critical path, because a mux is faster than the digit selection and remainder update happening in parallel with it. In an **unrolled or pipelined** divider the converter is replicated $k$ times, and the book's phrasing is precise about this: "two multiplexers the size of $Q_i$ and two registers in a pipelined design: it is fast but expensive in area" (p. 282). At $w = 53$, $k = 27$ that is $2 \times 53 \times 27$ flip-flops of pure bookkeeping.

**FPGA versus ASIC changes the verdict.** On an FPGA the mux-plus-register pair maps into the LUT and the flip-flop of the *same* logic cell, so a folded converter is roughly $2w$ cell-slots that were probably going to be occupied anyway — nearly free, and the alternative it displaces is a $w$-bit adder that would have burned a whole extra pass down the hard carry chain. On an ASIC the tradeoff is closer: a $w$-bit carry-lookahead adder is fast and small, and if the loop already contains a full-width carry-propagate adder for the partial remainder then one more at the end is inside the noise. On-the-fly conversion earns its area precisely when the loop has been made carry-free — that is, when the partial remainder is kept in [[Carry-Save Partial Remainder|carry-save]] form and the final subtraction would be the *only* carry propagation left in the design.

$$\boxed{\ Q^{\ominus}_i = Q_i - \beta^{-i} \quad\Longrightarrow\quad \{Q_i,\,Q^{\ominus}_i\} = \big(\text{mux}(Q_{i-1}, Q^{\ominus}_{i-1})\big) \Vert \text{digit}, \quad \text{cost } 2\times(w\text{-bit mux} + w\text{-bit reg}),\ \text{delay } O(1)\ }$$

**When it breaks.**

- If the recurrence still carries a full-width adder — a non-redundant partial remainder, as in plain [[Non-Restoring Division]] — the final subtraction adds one adder delay to a latency that already contains $k$ of them. Converting on the fly buys under $1/k$ of the latency for $2wk$ flip-flops. Do the subtraction.
- In a folded, one-digit-per-cycle divider the final subtraction is *one extra cycle out of $k$*. At $k = 27$ that is a 4% latency win for a permanent $2w$-flip-flop bill; it only pays if $k$ is small or the adder would need its own pipeline stage.
- The invariant $Q^{\ominus}_i = Q_i - \beta^{-i}$ presupposes a non-negative quotient. Sign and magnitude of the operands must be stripped before the loop; a signed divider handles the sign outside this block, and negating $Q$ afterwards reintroduces the carry propagation the block exists to avoid.
- The scheme is exact and unconditional — there is no width at which its asymptotics stop mattering, because its delay never depended on $w$ in the first place. What changes with $w$ is the area, linearly, forever.

> [!warning] Not covered in the source — needs outside research
> Correct rounding needs $Q_k$ *and* $Q_k + \beta^{-k}$ (round-up) as well as $Q_k$ (round-down). The source establishes that (9.34) is an exact identity so rounding is "a decision, not an approximation" (p. 280), but does not say how the incremented value is obtained without an adder. The standard answer in the literature is a third on-the-fly register $Q^{\oplus}_i = Q_i + \beta^{-i}$ maintained by the mirror-image recurrence; de Dinechin & Kumm do not give it, so it is not asserted here.

**RTL (Spade).**

```spade
/// One iteration of radix-2 on-the-fly conversion, digit set {-1,0,+1}.
/// Wiring only: two muxes and a bit append. No adder.
fn otf_step<#uint W>(q: uint<W>, qm: uint<W>, dpos: bool, dneg: bool) -> (uint<W>, uint<W>) {
    let dzero = !dpos && !dneg;
    let one:  uint<1> = 1;
    let zero: uint<1> = 0;
    let q_base  = if dneg { qm } else { q };
    let qm_base = if dpos { q  } else { qm };
    let q_next:  uint<W> = trunc(q_base  `concat` (if dzero { zero } else { one  }));
    let qm_next: uint<W> = trunc(qm_base `concat` (if dzero { one  } else { zero }));
    (q_next, qm_next)
}

/// The loop: one otf_step per SRT iteration, Q and Q-minus held in registers.
entity otf<#uint W>(clk: clock, start: bool, dpos: bool, dneg: bool) -> (uint<W>, uint<W>) {
    let ones: uint<W> = ~(0 as uint<W>);
    decl nq, nqm;
    reg(clk) q:  uint<W> reset(start: 0)    = nq;
    reg(clk) qm: uint<W> reset(start: ones) = nqm;
    let (nq, nqm) = otf_step(q, qm, dpos, dneg);
    (q, qm)
}
```

`q_base`/`qm_base` are the two 2:1 multiplexers in the diagram, `dneg`/`dpos` their selects; the `` `concat` `` plus `trunc` is the $\ll 1$ block — `concat` on integers puts its left operand high, so appending a `uint<1>` gives `uint<W+1>` and `trunc` drops the MSB, which is dead because only the low $i$ bits are live at step $i$. The `reset(start: ...)` is the synchronous load that establishes $Q_0 = 0$, $Q^{\ominus}_0 = \overline{0}$; `otf_step` itself is purely combinational, so this is exactly one iteration and the entity is the folded divider's converter, not an unrolled one. Synthesis will do one thing the drawing does not: the mux and the flip-flop of each bit collapse into a single LUT-FF pair (or a single mux-flop cell on ASIC), so the two boxes per row are one cell in the netlist.

Verified by simulation with `W = 8`: 3005 vectors, comparing the final $Q$ and $Q^{\ominus}$ against the behavioural accumulator $\mathrm{acc}_i = 2\,\mathrm{acc}_{i-1} + q_{-i}$ and $\mathrm{acc} - 1$. Named vectors include the worked example digit string $(1,1,1,0,0,0,0,\bar1) \Rightarrow Q = .11011111$, and the deliberately asymmetric $(1,0,0,0,0,0,0,0) = 128$ against $(0,\dots,0,1) = 1$, which a bit-reversed implementation would fail; then 3000 random digit strings.

**Related Notes.**

- [[SRT Division]] – depends-on: produces the signed-digit string this block consumes, one digit per iteration.
- [[Quotient Digit Selection Table]] – depends-on: emits $d^{+}$ and $d^{-}$, the only control this converter needs.
- [[Redundant Number Systems]] – supports: the digit split $q = -\beta q^{\ominus} + q^{\oplus}$ and the bound $\gamma \le \beta-1$ that makes $q^{\oplus}-1$ borrow-free.
- [[Carry-Save Partial Remainder]] – supports: removes the last carry propagation from the loop, which is what makes removing this one worth paying for.
- [[Ripple-Carry Adder]] – compares: the alternative is one $w$-bit subtraction of the two concatenations of (9.37), small in area and one carry propagation in latency.
- [[Barrel Shifters]] – counter-example: the shift here is by a compile-time-constant one digit position, so it is renaming wires, not a shifter; nothing in this block scales with $\log w$.
- [[Radix-4 Maximally Redundant Divider]] – extends: $\gamma = \beta-1 = 3$ is the tight case of the borrow-free condition derived above.
- [[Choosing a Divider]] – compares: where the $2wk$-flip-flop bill sits against the other latency levers.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.6 on-the-fly conversion, (9.36)–(9.43), pp. 280–282 — the final-subtraction conversion, the incremental recurrence and its obstruction, the pre-decremented register, and the cost statement "two multiplexers the size of $Q_i$ and two registers in a pipelined design".
- §9.2.5 termination and iteration count, (9.33)–(9.35), pp. 279–280 — $k = \lceil (w_F+3)/\alpha\rceil$, and the exactness of (9.34).
- §9.2.4 redundant digit sets, (9.27), (9.32), pp. 272–276 — the digit set $\{-\gamma,\dots,\gamma\}$ and the two's-complement digit encoding.
- §9.2.10 carry-save partial remainder, (9.44)–(9.45), pp. 286–287 — the loop condition under which this conversion pays.
