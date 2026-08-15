---
title: "Radix-64 Speculative Divider"
description: "Three radix-4 steps per cycle with carry-save remainder, strong prescaling, and every possible next remainder computed speculatively while the digit is chosen — the lowest-latency double-precision divider in the book, bought entirely with area."
kind: circuit
source: "ASA §9.2.9-9.2.10, pp. 286-288 (prescaling context, pp. 283-285)"
status: seed
spade: simulated
tags: [digital, divider, srt, digit-recurrence, carry-save, speculation, high-radix, iterative]
aliases:
  - Radix-64 Divider
  - Radix-64 SRT Divider
  - Speculative Divider
  - Bruguera Divider
  - Low-Latency Double-Precision Division
---

# Radix-64 Speculative Divider

An SRT divider whose "radix 64" is three chained radix-4 steps inside one clock cycle, made chainable by removing all three of the things that normally serialise a digit recurrence — the divisor from the selection function, the carry propagation from the remainder, and the selection from the critical path.

```tikz title="One radix-64 iteration: three chained speculative radix-4 steps on a carry-save remainder"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,x=1cm,y=1cm]

  %% ---------- prescaled divisor rail (enters from the far left) ----------
  \node[anchor=south,align=center] at (-1.4,11.35)
    {$D_{\text{scaled}}\in[\tfrac{126}{128},\tfrac{144}{128})$\\ $w_D$};
  \draw (-1.4,11.3) -- (-1.4,7.55) -- (0.3,7.55);
  \node[anchor=south,font=\footnotesize] at (-0.55,7.6) {to all five};

  %% ---------- the one register in the loop ----------
  \draw (0.3,10.1) rectangle (9.8,10.8);
  \node at (5.05,10.45) {\textsf{reg}\ \ $(S_i,\,C_i)$ --- carry-save, $2w_R$ bits};

  %% ---------- shift by beta = 4 and fan out ----------
  \draw (5.05,10.1) -- (5.05,9.5);
  \node[anchor=west,font=\footnotesize,align=left] at (5.15,9.82)
    {$R_i=S_i+C_i$; $\ll 2$ on both words $\Rightarrow\ \beta S_i,\ \beta C_i$};
  \draw (5.05,9.5) -- (11.45,9.5);
  \draw (11.45,9.5) -- (11.45,8.2);
  \node[anchor=west,font=\footnotesize,align=left] at (11.55,8.85)
    {6 leading bits,\\ short CPA};
  \draw (5.05,9.5) -- (5.05,8.6);

  %% ---------- speculation bank ----------
  \node[anchor=south,font=\footnotesize] at (5.05,8.68)
    {\textsf{speculation bank} --- five $3{:}2$ compressors, all evaluated while \textsf{sel} runs};
  \draw (0.3,7.2) rectangle (9.8,8.6);
  \draw (2.2,7.2) -- (2.2,8.6);
  \draw (4.1,7.2) -- (4.1,8.6);
  \draw (6.0,7.2) -- (6.0,8.6);
  \draw (7.9,7.2) -- (7.9,8.6);
  \node[align=center,font=\footnotesize] at (1.25,7.9) {$q{=}{-}2$\\[1pt] $\beta R_i{+}2D$};
  \node[align=center,font=\footnotesize] at (3.15,7.9) {$q{=}{-}1$\\[1pt] $\beta R_i{+}D$};
  \node[align=center,font=\footnotesize] at (5.05,7.9) {$q{=}0$\\[1pt] $\beta R_i$};
  \node[align=center,font=\footnotesize] at (6.95,7.9) {$q{=}{+}1$\\[1pt] $\beta R_i{-}D$};
  \node[align=center,font=\footnotesize] at (8.85,7.9) {$q{=}{+}2$\\[1pt] $\beta R_i{-}2D$};

  %% ---------- selection ----------
  \draw (10.3,7.2) rectangle (12.6,8.2);
  \node[align=center,font=\footnotesize] at (11.45,7.7)
    {\textsf{sel}\\ round to nearest,\\ saturate at $\pm2$};

  %% ---------- multiplexer ----------
  \draw (0.0,6.4) -- (10.1,6.4) -- (9.6,5.7) -- (0.5,5.7) -- cycle;
  \node[font=\footnotesize] at (4.2,6.05) {\textsf{mux} --- $2w_R$ bits wide};
  \foreach \x in {1.25,3.15,5.05,6.95,8.85} \draw (\x,7.2) -- (\x,6.4);

  %% q1 out of sel: steers the mux, and joins the digit assembly
  \draw (11.45,7.2) -- (11.45,6.05) -- (9.85,6.05);
  \node[anchor=west,font=\footnotesize] at (11.55,6.22) {$q_1$, 3 b};
  \draw (11.45,6.6) -- (13.0,6.6) -- (13.0,1.7);

  %% ---------- steps 2 and 3, identical cells ----------
  \draw (5.05,5.7) -- (5.05,5.1);
  \draw (1.3,4.3) rectangle (8.8,5.1);
  \node[font=\footnotesize] at (5.05,4.7) {radix-4 speculative step --- identical cell};
  \draw (8.8,4.7) -- (11.0,4.7) -- (11.0,1.7);
  \node[anchor=south,font=\footnotesize] at (10.0,4.75) {$q_2$};

  \draw (5.05,4.3) -- (5.05,3.7);
  \draw (1.3,2.9) rectangle (8.8,3.7);
  \node[font=\footnotesize] at (5.05,3.3) {radix-4 speculative step --- identical cell};
  \draw (8.8,3.3) -- (12.2,3.3) -- (12.2,1.7);
  \node[anchor=south,font=\footnotesize] at (10.0,3.35) {$q_3$};

  %% ---------- feedback: only this pair is clocked ----------
  \draw (5.05,2.9) -- (5.05,2.2) -- (14.4,2.2) -- (14.4,10.45) -- (9.8,10.45);
  \node[anchor=west,font=\footnotesize,align=left] at (14.5,6.4)
    {$(S_{i+1},C_{i+1})$\\ $2w_R$ bits};

  %% ---------- digit assembly ----------
  \draw (10.2,0.9) rectangle (13.8,1.7);
  \node[align=center,font=\footnotesize] at (12.0,1.3)
    {$Q_i=16q_1+4q_2+q_3$\\ $\in[-42,42]$, 7 b};
  \draw (12.0,0.9) -- (12.0,0.3);
  \node[anchor=north,font=\footnotesize] at (12.0,0.25) {radix-64 digit};

  %% ---------- what the drawing costs ----------
  \node[anchor=north west,align=left,font=\footnotesize] at (-1.6,2.0)
    {one clock cycle $=$ three radix-4 steps $=$ 6 quotient bits;\\
     no carry propagation anywhere in the loop except the\\
     short CPA feeding \textsf{sel}; only $(S_{i+1},C_{i+1})$ is registered.};

\end{circuitikz}
\end{document}
```

**Radix 64 is a factorisation, not a digit set.** A genuine radix-64 recurrence would need at least 65 digits and therefore up to 32 distinct multiples of $D$ on the mux — nobody builds that. Bruguera's divider [Bru18] instead uses $64 = 2^{2\times3}$: three ordinary radix-4 steps, chained combinationally, only the last result registered (p. 288). Composition is pure algebra. Substituting the radix-4 recurrence $R^{(j+1)} = 4R^{(j)} - q_j D$ into itself twice and using distributivity of $D$ over the sum,

$$R_{i+1} = 4\big(4(4R_i - q_1 D) - q_2 D\big) - q_3 D = 64 R_i - \big(16q_1 + 4q_2 + q_3\big)D$$

so the composite is a radix-64 recurrence whose digit is $Q_i = 16q_1 + 4q_2 + q_3$ with each $q_j \in \{-2,\dots,2\}$, i.e. $Q_i \in [-42, 42]$ on 7 bits. Its redundancy factor is $\rho = \gamma/(\beta-1) = 42/63 = 2/3$ — the *same* $\rho$ as the radix-4 step it was built from, so the invariant $|R_i| \le \rho D$ of [[SRT Division]] carries over unchanged and there is nothing new to prove about convergence.

**Prescaling is what makes the chain possible at all.** In an ordinary radix-4 SRT step the digit is read from a table of 6 bits of $\beta R_i$ and 3 bits of $D$ (Fig. 9.7, p. 276). Three of those tables in series is a hopeless critical path. [[Divisor Prescaling]] with Table 9.2 (p. 285) multiplies $X$ and $D$ by a common factor built from two additions, landing $D_{\text{scaled}} \in [\tfrac{126}{128}, \tfrac{144}{128}) = [0.984, 1.125)$. Once $D$ is that close to $1$ the selection wedges of the P-D diagram no longer tilt appreciably, the digit stops depending on $D$ altogether (Fig. 9.12b, p. 284), and selection becomes *round $\beta R_i$ to the nearest integer, ties up* — a 4-bit addition (p. 284). Three 4-bit adders in series is a path you can afford; three table lookups is not.

**Check that rounding really preserves the invariant.** Write $y = \beta R_i$ and $q = \operatorname{round}(y)$ clamped to $\pm\gamma = \pm 2$. In the unclamped branch $|y - q| \le \tfrac12$, and adding and subtracting $q$ inside $R_{i+1} = y - qD$ gives $R_{i+1} = (y - q) + q(1 - D)$, so by the triangle inequality $|R_{i+1}| \le \tfrac12 + 2|1 - D|$. Against the target $|R_{i+1}| \le \rho D = \tfrac23 D$ this is $\tfrac12 + 2(D-1) \le \tfrac23 D \iff D \le \tfrac98$ above $1$, and $\tfrac12 + 2(1-D) \le \tfrac23 D \iff D \ge \tfrac{15}{16}$ below it. The interval $[\tfrac{126}{128}, \tfrac{144}{128})$ sits exactly inside $[\tfrac{15}{16}, \tfrac98]$ — Table 9.2's bounds are not decoration, they are the tightest window in which round-to-nearest is a legal selection function at $\rho = 2/3$. In the clamped branch $q = \gamma = 2$ and $R_{i+1} = y - 2D \le \beta\rho D - \gamma D = \rho D$ by the definition (9.29) of $\rho$, which closes for free.

**Carry-save removes the only remaining carry chain.** The remainder is kept as a pair $(S_i, C_i)$ with $R_i = S_i + C_i$, each $w_R$ bits, so the loop carries $2w_R$ wires. Because $|q| \le 2$ the product $qD$ is one shifted, possibly negated copy of $D$, so $\beta R_i - qD$ is a bit heap of height 3 and one [[Carry-Save Adder]] level flattens it back to height 2 — no carry propagation at all in the loop, and only the final $R_k$ is converted to binary, for rounding and for the true remainder (p. 286). Multiplying by $\beta$ is a 2-bit left shift of *both* words, which is exact modulo $2^{w_R}$ and therefore costs nothing; the negation's $+1$ folds into the compressor's free carry input. See [[Compressor Trees]] for why height 3 is one level and not more. The bill lands on selection: $R_i$ now occupies twice the bits, so a naive table would need $6+6+3 = 15$ inputs instead of 9. A short carry-propagate adder over the leading bits fixes it, at the cost of an unknown carry of weight $2^t$ that eats into the overlap — (9.44)–(9.45) and Fig. 9.14, derived in [[Carry-Save Partial Remainder]]. In the radix-64 case study that leaves 6 bits of $\beta\widetilde R_i$ into the selection function (p. 288).

**Speculation is what hides selection behind the compressor.** Even after prescaling and carry-save, a step is *select, then* compress, then mux — the three delays in series, three times per cycle. Speculation removes the first: all five values $\beta R_i - qD$ for $q \in \{-2,\dots,2\}$ are computed in parallel while $q_{-i}$ is being determined, and a multiplexer controlled by $q_{-i}$ picks the winner (p. 288). The step delay drops from $t_{\text{sel}} + t_{\text{CSA}} + t_{\text{mux}}$ to $\max(t_{\text{sel}}, t_{\text{CSA}}) + t_{\text{mux}}$, and since the five compressions and the 6-bit CPA both start from the same $(\beta S_i, \beta C_i)$ they genuinely overlap. This is also *why* the trick is worth its price only here: at radix 2 the selection is a sign bit and there is nothing to hide, and in a single-step-per-cycle radix-4 divider the saving is one step's selection out of one cycle rather than three out of one.

**The area is the whole point of the design.** Per radix-4 step: five rows of $2w_R$-bit compressors instead of one, plus a $5{:}1$ mux $2w_R$ bits wide — and three such steps per cycle, so fifteen compressor rows and three wide muxes where a plain radix-4 SRT iteration has one adder and one small mux. On top of that, prescaling hardware (Fig. 9.13, two multiplexers and one addition) is duplicated for $X$ and for $D$, and the prescaled operands must be kept exactly, widening the whole iteration datapath by one MSB and three LSBs (p. 285). None of that buys throughput; it buys the shortest possible cycle for a fixed 10-cycle latency.

> [!important] What speculation actually purchases
> Every other lever in this design shortens the *iteration*. Speculation shortens nothing on its own — the five compressors do exactly the work the one compressor would have done, five times over. What it buys is *reordering*: the digit is no longer upstream of the arithmetic, so the two can happen at once. That is why its cost is a clean multiple of area with no compensating structural simplification anywhere else in the circuit.

**Iteration count, and what the loop control costs.** Correct rounding of a double-precision quotient needs $w_F + 3 = 55$ significand bits (§9.2.5, p. 271). At radix $\beta = 2^\alpha$ each cycle yields $\alpha$ bits, so

$$k = \left\lceil \frac{w_F + 3}{\alpha} \right\rceil = \left\lceil \frac{55}{6} \right\rceil = 10 \text{ cycles},$$

against $\lceil 55/2 \rceil = 28$ at radix 4 and $55$ at radix 2. Prescaling costs a little of that budget: with $X_{\text{scaled}} \in [\tfrac98, 4)$ the initialisation must be $R_1 = 2^{-3}X$ to satisfy $0 \le R_1 \le \rho D$ at $\rho = 2/3$ (p. 286), which throws away 3 binary positions of quotient weight; $\lceil 58/6 \rceil = 10$, so here it happens to be free. Around the loop sit a 4-bit down-counter, `load` multiplexers on the two $w_R$-bit remainder words, one prescaling pass before the loop and one carry-save-to-binary CPA after it, and [[On-the-Fly Quotient Conversion]] running three of its stages per cycle — two muxes and two quotient-width registers each, so six per cycle, which is the reason a high-radix on-the-fly converter is described as fast but area-hungry.

$$\boxed{\ R_{i+1} = 64R_i - Q_iD,\quad Q_i = \sum_{j=1}^{3}4^{3-j}q_j \in [-42,42],\quad \rho = \tfrac{42}{63} = \tfrac23,\quad k = \left\lceil\tfrac{w_F+3}{6}\right\rceil\ }$$

**When it breaks.**

- $D$ must be a normalized significand. The whole construction rests on prescaling $D$ into $[\tfrac{126}{128}, \tfrac{144}{128})$, and Table 9.2 reads the three leading non-trivial bits of an already-normalized $D$. For two arbitrary integers there is no such window — see [[Comparison-Based Digit Selection]] for the escape route.
- The $[\tfrac{15}{16}, \tfrac98]$ margin derived above has *no* slack left for the truncation error $2^t$ of the carry-save selection adder. Redundancy pays for that error out of the overlap $2\rho - 1$, which is why the selection input grows from 4 bits of exact $\beta R_i$ to 6 bits of $\beta\widetilde R_i$ — and Fig. 9.14 (p. 287) shows that in the *un*prescaled radix-4 case even 6 bits plus 3 bits of $D$ stop being enough at $t = -4$.
- Below double precision the ten-cycle latency stops being worth fifteen compressor rows: at 32 bits or fewer, the book's measured position is that plain radix-4 with the digit product merged into FPGA carry-chain LUTs is already fast enough (p. 288).
- On FPGA the argument partly inverts. Speculation spends muxes and LUTs, which are the scarce resource, to save carry-chain delay, which is the cheap one; the book's recommendation for large precisions there is high-radix carry-save (HRCS) instead, whose main overhead is extra registers — one in sixteen for a chunk size of 16 — plus the larger digit selection function (p. 288).
- The 1997 survey conclusion [HOH97] still applies: divider performance is only weakly sensitive to architecture but strongly sensitive to circuit technique (p. 287). This design is what happens when you accept that and spend everything on the circuit; it is not evidence that radix 64 as such is the right answer.

> [!warning] Not covered in the source — needs outside research
> The book devotes one paragraph to [Bru18] and gives **no** area, delay, LUT or gate figures, no clock frequency, and no comparison against the radix-4 baseline. "Latency bought with area" is the book's own summary and this note cannot quantify it. It also does not state the truncation position $t$, the exact digit set, or the selection margins Bruguera uses — only that the selection input is 6 bits of $\beta\widetilde R_i$. The digit set $\{-2,\dots,2\}$ and the round-to-nearest selection used throughout this note are the ones the prescaling section (pp. 284-286) establishes for radix 4 with $\gamma = 2$; treat them as the book's default rather than as verified details of [Bru18].

**RTL (Spade).** One radix-64 iteration — three chained speculative radix-4 steps, carry-save throughout, one register:

```spade
/// 3:2 compressor: one full adder per bit. s + c is preserved exactly mod 2^W.
fn csa<#uint W>(a: int<W>, b: int<W>, c: int<W>) -> (int<W>, int<W>) {
    let sum: int<W> = a ^ b ^ c;
    let carry: int<W> = ((a & b) | (a & c) | (b & c)) << 1;
    (sum, carry)
}

/// Digit selection after strong prescaling: round beta*R to the nearest
/// integer and saturate at the digit-set bound gamma = 2.
fn sel4(ys: int<16>, yc: int<16>) -> int<3> {
    let y: int<16> = ys +. yc;
    let r: int<16> = (y +. 2048) >>> 12;
    if r > 2 { 2 } else { if r < -2 { -2 } else { trunc(r) } }
}

/// One speculative radix-4 step on a carry-save remainder.
fn r4_step(s: int<16>, c: int<16>, d: int<16>) -> (int<16>, int<16>, int<3>) {
    let ys: int<16> = s << 2;
    let yc: int<16> = c << 2;

    let cm2 = csa(ys, yc, d << 1);        // all five speculated in parallel
    let cm1 = csa(ys, yc, d);
    let cz  = (ys, yc);
    let cp1 = csa(ys, yc, -d);
    let cp2 = csa(ys, yc, -(d << 1));

    let q = sel4(ys, yc);                 // runs concurrently with the bank
    let (ns, nc) = match q {
        -2 => cm2,
        -1 => cm1,
        0  => cz,
        1  => cp1,
        _  => cp2,
    };
    (ns, nc, q)
}

/// ONE radix-64 iteration: three chained radix-4 steps, one register at the end.
entity radix64_iter(clk: clock, load: bool, r_init: int<16>, d: int<16>)
    -> (int<16>, int<7>)
{
    decl ns, nc;
    reg(clk) (s, c): (int<16>, int<16>) reset(load: (r_init, 0)) = (ns, nc);

    let (s1, c1, q1) = r4_step(s,  c,  d);
    let (s2, c2, q2) = r4_step(s1, c1, d);
    let (s3, c3, q3) = r4_step(s2, c2, d);
    let ns = s3;
    let nc = c3;

    let a: int<7> = sext::<3, 7>(q1) << 4;
    let b: int<7> = sext::<3, 7>(q2) << 2;
    let e: int<7> = sext::<3, 7>(q3);
    (s +. c, a +. b +. e)
}
```

`(s, c)` is the register at the top of the diagram, `s << 2` and `c << 2` are the $\ll 2$ on the bus, the five `csa` calls are the five cells of the speculation bank and the `match` is the mux; `r4_step` applied three times is the vertical chain, and only the third result crosses `reg`, so the entity is exactly one clock cycle. The instance is a $\text{sfix}(3,-12)$ format: 16 bits, 12 fractional, so `2048` is $\tfrac12$ and `>>> 12` extracts the integer part, making `sel4` literally *round to nearest, ties up, saturate at $\pm 2$*. Two things synthesis and the book do differently from this listing: real hardware feeds `sel4` only the 6 leading bits of a *truncated* carry-propagate sum, where this model adds `ys +. yc` in full (the truncation error is [[Carry-Save Partial Remainder]]'s subject, not this note's), and `s +. c` at the output is drawn here every cycle where hardware converts carry-save to binary once, at the end.

`radix64_iter` was simulated over 4 iterations per case against the exact identity $R_{k+1} = 64^k R_1 - D\sum_j 64^{k-j}Q_j$ together with the invariant $3|R_i| \le 2D$ and the digit bound $|Q_i| \le 42$: **3008 vectors passed, 8 named plus 3000 random**, the named ones including both ends of the prescaled window ($D = \tfrac{126}{128}$ with $R_1 = \rho D$, $D$ just under $\tfrac{144}{128}$ with $R_1 = -\rho D$) and asymmetric cases such as $R_1 = 1$ against $D = 1$.

**Related Notes.**

- [[SRT Division]] – extends: this is one SRT iteration with every available lever pulled at once.
- [[Radix-4 Maximally Redundant Divider]] – compares: the other way to spend area on a shorter recurrence, buying a smaller table with $\gamma = 3$ rather than a shorter path with speculation.
- [[Divisor Prescaling]] – depends-on: without $D_{\text{scaled}}$ near 1 the selection function still depends on $D$ and the three-step chain is unbuildable.
- [[Carry-Save Partial Remainder]] – depends-on: supplies the redundant remainder and the $2^t$ truncation budget (9.44)–(9.45) that costs this design 2 extra selection bits.
- [[Carry-Save Adder]] – depends-on: the single $3{:}2$ level that replaces the loop's carry propagation.
- [[Compressor Trees]] – supports: why a height-3 bit heap flattens in one level and $|q|\le2$ keeps it at height 3.
- [[Quotient Digit Selection Table]] – counter-example: the table this design deletes; prescaling replaces a 9-input lookup with a 4-bit addition.
- [[On-the-Fly Quotient Conversion]] – supports: three of its stages run per cycle so the 7-bit radix-64 digit never needs a final carry propagation.
- [[Comparison-Based Digit Selection]] – compares: the alternative when $D$ cannot be prescaled, at the price of two carry propagations in series.
- [[Floating-Point Operators]] – supports: the $w_F + 3$ bit target and the exponent/normalisation wrapper that make 10 cycles the whole divide latency.
- [[Rounding]] – supports: why the exact final remainder, once converted out of carry-save, hands over the rounding decision at no cost.
- [[Choosing a Divider]] – compares: where ten cycles and fifteen compressor rows stop being the right trade.
- [[FPGAs]] – counter-example: on LUT fabric the levers reverse and HRCS beats speculation.
- [[Dividers]] – compares: the family this is the extreme point of.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.2.8 prescaling: Table 9.2 and Fig. 9.13, p. 285; selection by rounding, Fig. 9.12b, p. 284; datapath widening and the $R_1 = 2^{-3}X$ initialisation, pp. 285-286.
- §9.2.9 carry-save partial remainder, (9.44)-(9.45), Fig. 9.14, pp. 286-287; [HOH97] circuit-technique conclusion, p. 287; FPGA carry logic and HRCS, p. 288.
- §9.2.10 case study, low-latency double-precision division [Bru18], p. 288.
- §9.2.4 redundancy factor (9.29) and the selection interval (9.30), pp. 272-274; §9.2.5 the $w_F+3$ iteration-count target, p. 271.
