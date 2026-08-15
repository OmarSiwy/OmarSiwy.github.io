---
title: "On-the-Fly Converter"
description: "Carries a pre-decremented copy of the partial result alongside it so a negative redundant digit is absorbed by concatenation; two muxes and two registers per iteration, no adder."
kind: circuit
source: "ASA §19.1.5.4, pp. 587-588"
status: seed
spade: simulated
tags: [digital, square-root, digit-recurrence, redundant, conversion, fpga]
aliases:
  - OTF Converter
  - On-the-Fly Conversion of Si
  - Pre-Decremented Root Register
---

# On-the-Fly Converter

A two-register shift structure that turns a redundant signed-digit result into standard binary as the digits are produced, keeping a copy of the result already decremented by one ulp so that a negative digit is absorbed by *selecting* the other register rather than by propagating a borrow.

```tikz title="One iteration of radix-4 on-the-fly conversion: two cross-coupled registers, two W-bit muxes, a 2-bit concatenation, no adder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
  % ---------------- blocks ----------------
  \draw (-0.7,0.0) rectangle (1.4,2.6);
  \node[align=center] at (0.35,1.3) {digit\\decode\\(no adder,\\wires only)};

  \draw (2.6,2.6) rectangle (3.5,4.0);  \node at (3.05,3.3) {2:1};
  \draw (2.6,-0.4) rectangle (3.5,1.0); \node at (3.05,0.3) {2:1};

  \draw (4.3,2.75) rectangle (6.1,3.85);
  \node[align=center] at (5.2,3.3) {shift in\\$\Vert\ m^{\oplus}$};
  \draw (4.3,-0.25) rectangle (6.1,0.85);
  \node[align=center] at (5.2,0.3) {shift in\\$\Vert\ m^{\ominus}$};

  \draw (6.9,2.75) rectangle (8.4,3.85);
  \node[align=center] at (7.65,3.3) {reg $S_i$\\$W$ bits};
  \draw (6.9,-0.25) rectangle (8.4,0.85);
  \node[align=center] at (7.65,0.3) {reg $S_i^{\ominus}$\\$W$ bits};

  % ---------------- forward path ----------------
  \draw[->] (3.5,3.3) -- (4.3,3.3) node[midway,above] {$W$};
  \draw[->] (3.5,0.3) -- (4.3,0.3) node[midway,above] {$W$};
  \draw[->] (6.1,3.3) -- (6.9,3.3);
  \draw[->] (6.1,0.3) -- (6.9,0.3);

  % ---------------- digit in ----------------
  \draw[->] (-2.0,1.3) -- (-0.7,1.3) node[midway,above] {$d_{-i}$} node[midway,below] {3};
  \node[anchor=east,align=right,font=\scriptsize] at (-2.05,1.3)
    {from digit\\selection,\\$d\in\{-2,\dots,2\}$};

  % magnitude fields
  \draw[->] (1.4,1.8) -- (5.2,1.8) -- (5.2,2.75);
  \node[anchor=south,font=\scriptsize] at (3.85,1.85) {$m^{\oplus}=d \bmod \beta$};
  \node[anchor=west,font=\scriptsize] at (5.25,2.3) {2};
  \draw[->] (0.35,0.0) -- (0.35,-1.15) -- (5.2,-1.15) -- (5.2,-0.25);
  \node[anchor=north,font=\scriptsize] at (3.85,-1.2) {$m^{\ominus}=(d-1) \bmod \beta$};
  \node[anchor=west,font=\scriptsize] at (5.25,-0.75) {2};

  % mux selects
  \draw[->,dashed] (1.4,2.3) -- (1.75,2.3) -- (1.75,4.6) -- (3.05,4.6) -- (3.05,4.0);
  \node[anchor=west,font=\scriptsize] at (3.15,4.6) {$d\ge 0$};
  \draw[->,dashed] (1.4,0.3) -- (1.55,0.3) -- (1.55,1.6) -- (3.05,1.6) -- (3.05,1.0);
  \node[anchor=west,font=\scriptsize] at (3.15,1.3) {$d\ge 1$};

  % ---------------- feedback: S_i to both muxes ----------------
  \draw (8.7,3.3) -- (8.7,5.0) -- (2.3,5.0) -- (2.3,0.7);
  \node[anchor=south,font=\scriptsize] at (5.5,5.0) {$S_i$, $W$ bits};
  \draw[->] (2.3,3.7) -- (2.6,3.7);
  \draw[->] (2.3,0.7) -- (2.6,0.7);
  \filldraw (2.3,3.7) circle (1.5pt);
  % ---------------- feedback: S_i^ominus to both muxes ----------------
  \draw (9.2,0.3) -- (9.2,-1.9) -- (2.05,-1.9) -- (2.05,2.9);
  \node[anchor=north,font=\scriptsize] at (6.4,-1.9) {$S_i^{\ominus}$, $W$ bits};
  \draw[->] (2.05,-0.1) -- (2.6,-0.1);
  \draw[->] (2.05,2.9) -- (2.6,2.9);
  \filldraw (2.05,-0.1) circle (1.5pt);

  % ---------------- outputs ----------------
  \draw (8.4,3.3) -- (8.7,3.3);
  \draw[->] (8.7,3.3) -- (10.3,3.3);
  \filldraw (8.7,3.3) circle (1.5pt);
  \node[anchor=west,align=left,font=\scriptsize] at (10.35,3.3)
    {$S_i$, already binary:\\to the selection\\function, and the\\final result};
  \draw (8.4,0.3) -- (9.2,0.3);
  \draw[->] (9.2,0.3) -- (10.3,0.3);
  \filldraw (9.2,0.3) circle (1.5pt);
  \node[anchor=west,align=left,font=\scriptsize] at (10.35,0.3) {$S_i^{\ominus}=S_i-\beta^{-i}$};

  % ---------------- annotation ----------------
  \node[anchor=north west,align=left,text width=6.0cm,font=\scriptsize] at (-2.9,-2.6)
    {\textbf{One iteration.} The only combinational logic between two registers is a
     $W$-bit 2:1 multiplexer and a 2-bit concatenation --- no adder, no carry chain,
     so the converter never lands on the critical path of the recurrence.};
  \node[anchor=north west,align=left,text width=6.0cm,font=\scriptsize] at (4.4,-2.6)
    {\textbf{Cost.} $2W$ mux bits and $2W$ flip-flops per pipeline stage, against the
     one $W$-bit borrow-propagate subtractor per stage that a single-register $S_i$
     would need.};
\end{circuitikz}
\end{document}
```

**Locate the problem the converter exists to solve.** A redundant digit recurrence produces its result one signed digit at a time, $S_{i} = S_{i-1} + \beta^{-i} d_{-i}$ with $d_{-i} \in \{-\gamma,\dots,\gamma\}$ ([[Redundant Number Systems]]). When $d_{-i}\ge 0$ that update is not an addition at all: every bit of $S_{i-1}$ below position $-i{+}1$ is already zero, so writing the digit into the vacant field is pure **concatenation**, free wiring. When $d_{-i}<0$ it is a genuine subtraction, and its borrow can run the whole width of the result built so far — $W$ bits for a $W$-bit root, growing with $i$.

**Establish why the square root cannot defer that subtraction to the end, and division can.** In [[SRT Division]] the selection function reads the residual and the *divisor*, which is a constant; the quotient digits can therefore be accumulated in redundant form and converted once, after the last iteration. In [[SRT Square Root]] the selection boundaries are lines of slope $2(d\pm\rho)$ in $S_i$ — the result *being built* — so a truncated $\widetilde{S_i}$ in standard binary is an **input to the next iteration's digit selection** ([[Square Root Digit Selection Function]]). The conversion sits inside the loop. That is the whole reason this circuit is a per-iteration structure rather than a post-processing step, and it is why the square root inherits a cost the divider does not.

**Introduce the second register, and check that it removes the borrow.** Maintain, alongside $S_i$, the **pre-decremented** copy
$$S_i^{\ominus} = S_i - \beta^{-i}$$
i.e. $S_i$ minus one unit in the last digit position produced so far. The point is not that $S^{\ominus}$ is useful in itself but that the *result of the only subtraction the recurrence ever needs is already sitting in a register*. Writing the digit in two's complement as $d = -\beta s + m$, where $s\in\{0,1\}$ is its sign bit and $m$ its $\alpha = \log_2\beta$ low bits, a negative digit becomes
$$S_{i-1} + \beta^{-i}d \;=\; \underbrace{\left(S_{i-1} - \beta^{-i+1}\right)}_{=\,S_{i-1}^{\ominus}} + \beta^{-i}\underbrace{(\beta + d)}_{=\,m\,\ge\,0}$$
using only $\beta^{-i}\cdot\beta = \beta^{-i+1}$ and the definition of $S^{\ominus}$ at index $i-1$. The right-hand side is a non-negative field appended to a register whose low bits are zero — a concatenation again. The sign of the digit has been converted from an arithmetic operation into a **register selection**.

**Collapse the book's three cases into one.** [ASA] states the recurrence by sign of the digit (Eqs. 19.46–19.48): for $d_{-i}>0$ append to $S_{i-1}$, for $d_{-i}=0$ hold $S$ and append $\beta-1$ to $S^{\ominus}$, for $d_{-i}<0$ append to $S_{i-1}^{\ominus}$. Because $m = d \bmod \beta$ is exactly the low $\alpha$ bits of the two's-complement digit and reproduces every one of those cases — $d=2 \mapsto 2$, $d=0\mapsto 0$, $d=-1 \mapsto \beta-1$, $d=-2\mapsto \beta-2$ — the three cases are one line with two different selectors. Applying the same argument to $S^{\ominus}$ with the digit $d-1$ gives its update for free, since $S_i^{\ominus} = S_{i-1}^{(\cdot)} + \beta^{-i}(m-1)$ is the $d-1$ instance of the identity above.

> [!warning] Superscript inconsistency in the source
> ASA p. 587 defines $d_j = -\beta d_j^{\ominus} + d_j^{\oplus}$ and says explicitly that $d_j^{\oplus}$ is the $\alpha$-bit digit and $d_j^{\ominus}$ the single bit. Eq. (19.48), the $d<0$ branch, then adds $\beta^{-i}d^{\ominus}_{-i}$ — a single bit, always $1$ for a negative digit, which would give $S_i = S_{i-1}^{\ominus} + \beta^{-i}$ and is wrong. The addend there must be the $\alpha$-bit field $d^{\oplus}_{-i} = \beta + d_{-i}$; with that reading Eqs. (19.46)–(19.48) are consistent and match the derivation above. Verify the invariant, not the superscripts.

**Verify both invariants by induction, because the circuit is only correct if they hold jointly.** Assume $S_{i-1} = \sum_{j\le i-1}\beta^{-j}d_{-j}$ and $S_{i-1}^{\ominus} = S_{i-1} - \beta^{-i+1}$. For $d_{-i}\ge 0$: $S_i = S_{i-1}+\beta^{-i}m$ with $m=d_{-i}$, which is the first invariant; and $S_i^{\ominus}$ takes $m-1$, so $S_i^{\ominus} = S_i - \beta^{-i}$ — unless $d_{-i}=0$, where $m-1 = -1$ is not a legal field and the selector falls back to $S_{i-1}^{\ominus}$ with field $\beta-1$, giving $S_{i-1}-\beta^{-i+1}+\beta^{-i}(\beta-1) = S_{i-1}-\beta^{-i}$, the same thing. That single boundary case is exactly why the two multiplexers need **different** selectors, $d\ge 0$ for $S$ and $d\ge 1$ for $S^{\ominus}$. For $d_{-i}<0$ both selectors pick $S^{\ominus}_{i-1}$ and the displayed identity closes the induction.

**Read the cost off the datapath.** Per iteration: two $W$-bit 2:1 multiplexers, two $W$-bit registers, and an $\alpha$-bit concatenation that is wiring. No adder, no carry chain, and the delay is one mux — independent of $W$, which is the property that matters, since the competing borrow-propagate subtractor grows with the result width while the residual update of a redundant recurrence does not. A $W$-bit result at radix $\beta = 2^\alpha$ needs $N = \lceil W/\alpha\rceil$ iterations, less whatever a seed table supplies ([[Square Root Seed Table]]); the loop control is a $\lceil\log_2 N\rceil$-bit counter selecting the digit position, and in a fully unrolled pipeline even that disappears because each stage's insertion position is hardwired. Against the alternative it is a clear trade: $2W$ flip-flops and $2W$ mux bits per stage, bought with the removal of one $W$-bit subtractor per stage.

**Collect a consequence the invariant gives away for free.** Digit recurrences finish with a correction step: if the final residual is negative the last digit overshot and the true result is one ulp smaller. Since $S_N^{\ominus}$ *is* $S_N$ minus one ulp by construction, that correction is the final output multiplexer already present in the diagram — no end-of-loop subtraction, and no separate rounding adder ([[Rounding]]). The converter therefore pays for itself twice.

**Note where FPGAs invert the conclusion.** On an FPGA a $W$-bit subtraction rides the hard carry chain at a latency comparable to computing the residual $W_{i+1}$ itself, so the borrow is not the disaster it is in ASIC. But doing it once *per iteration* adds a second adder per iteration, which cancels radix-4's advantage over the radix-2 [[Non-Restoring Square Root]]: half as many iterations, each twice as expensive. Worse, a $W$-bit 2:1 mux costs $W$ LUTs while a $W$-bit adder costs $W$ LUTs *and* the free carry chain, so the converter's two muxes are not obviously cheaper than the subtractor they replace ([[FPGAs]]). The book's FPGA alternative is to skip per-iteration conversion entirely, convert once at the end, and feed the selection function a truncated $\widetilde{S_i}$ accurate to $t_S$ only. For even $t_S$ the discarded tail is bounded by $\sum_{j\ge t_S/2}2\beta^{-j} = \rho\beta^{-t_S/2}$, so the selection constraints acquire
$$\widetilde{S_i}-\rho\beta^{-t_S/2} < S_i < \widetilde{S_i}+\rho\beta^{-t_S/2}$$
which may make the selection table more expensive. Which side wins is precision- and radix-dependent.

> [!warning] Not covered in the source — needs outside research
> ASA p. 587 states outright that a complete study of the on-the-fly-converter versus truncated-$\widetilde{S_i}$ trade-off on FPGA "remains to be done". There are no LUT, flip-flop or delay figures in the chapter for either option, so the FPGA comparison above is structural reasoning, not measurement.

$$\boxed{\;
S_i = \big(d_{-i}\ge 0 \;?\; S_{i-1} : S_{i-1}^{\ominus}\big) \Vert m^{\oplus},
\qquad
S_i^{\ominus} = \big(d_{-i}\ge 1 \;?\; S_{i-1} : S_{i-1}^{\ominus}\big) \Vert m^{\ominus}
\;}$$

with $m^{\oplus} = d_{-i} \bmod \beta$, $m^{\ominus} = (d_{-i}-1)\bmod \beta$, both $\alpha=\log_2\beta$ bits, and $\Vert$ pure concatenation. Invariants maintained: $S_i = \sum_{j\le i}\beta^{-j}d_{-j}$ and $S_i^{\ominus} = S_i - \beta^{-i}$.

**When it breaks.**

- **Over-redundant digit sets.** $m = d\bmod\beta$ fits in $\alpha$ bits only for $d \in [-\beta,\ \beta-1]$, i.e. $\gamma \le \beta-1$. A maximally redundant or over-redundant set ($\gamma \ge \beta$) needs a wider field and the concatenation stops being disjoint — the digit would overlap the previous one and you are back to an adder.
- **Seeded initialisation is not free.** If $S_{i_0}$ comes from a table ([[Square Root Seed Table]]) rather than from $S_0=1$, you must also load $S_{i_0}^{\ominus} = S_{i_0}-\beta^{-i_0}$. That is one real subtraction — or a second table, or one extra table bit — paid once, outside the loop.
- **Area, at double precision.** $2W$ flip-flops per stage is $\approx 106$ per stage for a 53-bit root. In a fully unrolled pipeline that dominates the residual datapath, whose adders are only a few digits wide. Iterative (folded) implementations pay it once and do not care.
- **Low precision.** Below roughly 16 bits the borrow chain it removes is short enough that a plain subtractor is smaller and no slower; the structure earns its keep when $W$ is large relative to the residual width.
- **FPGA, radix 4 and above.** See the paragraph above — the hard carry chain makes the subtraction the converter avoids nearly free, and the two muxes cost real LUTs. [[Choosing a Digit Recurrence]] is the place to settle it for a given target.
- **Non-redundant recurrences.** A restoring or non-restoring binary recurrence produces digits in $\{0,1\}$ or $\{-1,1\}$ already tied to a fixed correction pattern; the converter has nothing to buy there beyond what the recurrence's own $S$/$S{-}\text{ulp}$ pair already gives.

**RTL (Spade).** One iteration, radix 4, digit set $\{-2,\dots,2\}$:

```spade
entity otf_step<#uint W>(clk: clock, rst: bool, d: int<3>) -> (uint<W>, uint<W>) {
    decl a_next;
    decl b_next;
    reg(clk) a: uint<W> reset(rst: 1) = a_next;   // S_i,  scaled to an integer
    reg(clk) b: uint<W> reset(rst: 0) = b_next;   // S_i^ominus = S_i - 1 ulp

    // low alpha=2 bits of the two's-complement digit, and of the digit minus one
    let mag_a: uint<2> = trunc(d.as_uint());
    let mag_b: uint<2> = trunc((d - 1).as_uint());

    // the sign of the digit picks a register instead of driving a borrow
    let src_a = if d >= 0 { a } else { b };
    let src_b = if d >= 1 { a } else { b };

    let a_next: uint<W> = trunc(src_a `concat` mag_a);
    let b_next: uint<W> = trunc(src_b `concat` mag_b);
    (a, b)
}
```

`a` and `b` are the two registers in the diagram; `src_a`/`src_b` are the two multiplexer outputs, and `` `concat` `` is the shift-in block — it grows `uint<W>` to `uint<{W+2}>`, and the `trunc` back to `uint<W>` is the two leading digits leaving the top of a fixed-width shift register, so $W$ must be sized to the whole result ($W \ge \alpha N$ plus the seed) or leading digits are lost. Everything between the registers is combinational and $W$-independent in depth: one mux, then wiring. The registers hold $\beta^i S_i$ and $\beta^i S_i^{\ominus}$ as integers, which is why the invariant appears in hardware as the plain relation `b == a - 1`. Synthesis will not build the concatenation at all — it is the register's input routing — and it will merge the two selectors into one shared sign decode, which the diagram draws as a separate block only to keep the muxes' control paths visible.

Simulated against a behavioural reference that accumulates $\beta^i S_i = \beta\,\beta^{i-1}S_{i-1} + d_{-i}$ independently of the circuit structure, checking both $S_i$ and the invariant $S_i^{\ominus} = S_i - 1$ ulp: 3017 vectors, including the asymmetric digit string $1,-2,0,2,-1$ (which must yield $135$, and does not survive a swapped selector), the all-$(-2)$ and all-$(+2)$ extremes, and 300 random 10-digit sequences over the full digit set. No mismatches.

**Related Notes.**

- [[SRT Square Root]] – depends-on: the consumer of this circuit; its selection function reads the binary $S_i$ this converter produces, which is why the conversion is in the loop at all.
- [[SRT Division]] – compares: same idiom, but division's selection reads a constant divisor, so the divider may defer conversion to the end and skip the per-iteration cost.
- [[Redundant Number Systems]] – depends-on: supplies the signed digit set whose negative digits create the problem, and the $\rho=\gamma/(\beta-1)$ that bounds it.
- [[Square Root Digit Selection Function]] – supports: the truncated $\widetilde{S_i}$ it consumes is exactly what forces the conversion to be on-the-fly.
- [[Square Root Seed Table]] – extends: a tabulated $S_{i_0}$ must supply $S_{i_0}^{\ominus}$ too, the one place the structure needs a real subtraction.
- [[Non-Restoring Square Root]] – counter-example: at radix 2 with no redundancy there is no conversion to do, and on FPGA it beats the radix-4 recurrence this converter serves.
- [[Choosing a Digit Recurrence]] – compares: where the extra $2W$ flip-flops per stage do and do not pay for themselves.
- [[Dividers]] – compares: the topic hub where the divider-side version of this structure sits.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 19, *Digit Recurrence for Algebraic Functions*.

- §19.1.5.4 *On-the-Fly Conversion of $S_i$*, Eqs. (19.46)–(19.48), the invariants $S_i=\sum_j\beta^jd_j$ and $S_i^{\ominus}=S_i-\beta^{-i}$, and the "two multiplexers the size of $S_i$ and two registers … fast but expensive in area" cost statement — pp. 587–588
- §19.1.5.4, FPGA discussion: fast-carry subtraction, the second adder per iteration, the truncated $\widetilde{S_i}$ alternative and Eq. (19.45) — p. 587
- §19.1.5.3 selection-function parameters that make the binary $\widetilde{S_i}$ an input ($t_W=t_S=-4$, $i_0=3$), and Fig. 19.6, the P-D diagram whose boundaries move with $S_i$ — pp. 585–587
- §9.2.6 *On-the-fly conversion* (division), cross-referenced from p. 587 as the original of the technique — p. 280

Primary source cited by the chapter: Ercegovac & Lang, *Division and Square Root: Digit-Recurrence Algorithms and Implementations* (1994).
