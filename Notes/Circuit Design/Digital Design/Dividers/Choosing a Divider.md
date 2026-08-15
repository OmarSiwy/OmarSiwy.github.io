---
title: Choosing a Divider
description: "Trade-off table across the 18 Dividers circuits, with the source's own numbers — and the one fork (exact remainder or faithful quotient) that decides most of them before latency is even discussed."
kind: comparison
source: "ASA Ch. 9, pp. 259-305"
status: seed
spade: n/a
tags: [digital, dividers, comparison, fpga, vlsi]
aliases:
  - Divider Comparison
  - Divider Trade-offs
  - Which Divider
  - Divider Selection
  - Choosing a Division Algorithm
---

# Choosing a Divider

Division splits into two families that share almost no hardware: digit recurrences, which subtract a multiple of $D$ per cycle and end holding the exact remainder, and multiplicative methods, which approximate $1/D$ and can only ever be faithful.

```tikz title="Newton-Raphson chains its squarer into its multiplier; the quadratic series issues both at once"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % delay rulers
  \foreach \x in {2.35,4.85} \draw[dashed,gray!70] (\x,1.05) -- (\x,3.0);
  \foreach \x in {2.35,4.85} \draw[dashed,gray!70] (\x,-2.7) -- (\x,-1.05);
  \node[gray,anchor=south,font=\scriptsize] at (2.35,3.0) {$1\,t_{\times}$};
  \node[gray,anchor=south,font=\scriptsize] at (4.85,3.0) {$2\,t_{\times}$};

  % ---------------- panel A : Newton-Raphson, serial
  \node[anchor=west,font=\bfseries] at (-2.6,2.55) {Newton-Raphson};
  \node[anchor=west,font=\scriptsize] at (-2.6,2.15) {$R_{i+1}=2R_i-D\,R_i^{2}$};

  \draw (0.35,1.15) rectangle (2.35,1.95);
  \node at (1.35,1.55) {squarer (exact)};
  \draw (2.85,1.15) rectangle (4.85,1.95);
  \node at (3.85,1.62) {$\times\,D$};
  \node[font=\scriptsize] at (3.85,1.34) {truncated};
  \draw (5.35,1.15) rectangle (7.05,1.95);
  \node at (6.2,1.55) {$2R_i-{\cdot}$};

  \draw[->,>=latex] (-1.55,1.55) -- (0.35,1.55);
  \node[anchor=north,font=\scriptsize] at (-0.6,1.48) {$|\ell_i|{+}1$ b};
  \node[anchor=south,font=\scriptsize] at (-0.6,1.62) {$R_i$};
  \draw[->,>=latex] (2.35,1.55) -- (2.85,1.55);
  \draw[->,>=latex] (4.85,1.55) -- (5.35,1.55);
  \draw[->,>=latex] (7.05,1.55) -- (9.15,1.55);
  \node[anchor=north,font=\scriptsize] at (8.1,1.48) {$2|\ell_i|{+}1$ b};
  \node[anchor=south,font=\scriptsize] at (8.1,1.62) {$R_{i+1}$};
  \node[anchor=north,font=\scriptsize,align=center] at (3.7,0.95)
    {strictly in series --- the square must land before the product starts};

  % ---------------- panel B : quadratic series, parallel
  \node[anchor=west,font=\bfseries] at (-2.6,-0.15) {Quadratic series};
  \node[anchor=west,font=\scriptsize] at (-2.6,-0.55) {$E_{i+1}=E_i^{2}$};
  \node[anchor=west,font=\scriptsize] at (-2.6,-0.9) {$Q_{i+1}=Q_i+Q_iE_i$};

  \draw (0.35,-1.75) rectangle (2.35,-1.15);
  \node at (1.35,-1.45) {squarer};
  \draw (0.35,-2.6) rectangle (2.35,-2.0);
  \node at (1.35,-2.3) {$\times\,Q_i$};
  \draw (2.85,-2.6) rectangle (4.15,-2.0);
  \node at (3.5,-2.3) {$Q_i+{\cdot}$};

  \draw[->,>=latex] (-1.55,-1.45) -- (0.35,-1.45);
  \node[anchor=south,font=\scriptsize] at (-0.6,-1.4) {$E_i$};
  \draw[->,>=latex] (-1.55,-2.3) -- (0.35,-2.3);
  \node[anchor=south,font=\scriptsize] at (-0.6,-2.25) {$E_i,\,Q_i$};
  \draw[->,>=latex] (2.35,-1.45) -- (9.15,-1.45);
  \node[anchor=south,font=\scriptsize] at (7.4,-1.4) {$E_{i+1}$ --- \emph{narrower each step}};
  \draw[->,>=latex] (2.35,-2.3) -- (2.85,-2.3);
  \draw[->,>=latex] (4.15,-2.3) -- (9.15,-2.3);
  \node[anchor=south,font=\scriptsize] at (7.4,-2.25) {$Q_{i+1}$ --- fixed LSB $\ell$};
  \node[anchor=north,font=\scriptsize,align=center] at (3.3,-2.75)
    {both boxes read $E_i$ only, so they issue together};
\end{circuitikz}
\end{document}
```

*after Figs. 9.16 and 9.17b, pp. 292 and 296, drawn on a common delay axis; the two rows have identical iteration counts and differ only in dependency shape.*

**The complete operators.** Every row divides; the columns are what you give up.

| Circuit | Latency (cycles) | Hardware per step | Big multipliers | LUT · DSP · ns | Result | p. |
| --- | --- | --- | --- | --- | --- | --- |
| [[Restoring Division]] | $w_Q$ | $(w_D{+}1)$-bit subtract **then** $w_D$-bit restore mux — two logic depths, mux after the slowest adder bit | none | — | exact $R$ ⇒ correctly roundable | 266-269 |
| [[Non-Restoring Division]] | $w_Q + 1$ (one correction iteration) | one $(w_D{+}2)$-bit add/sub, $\pm$ registered a cycle early — **one** logic depth, no mux | none | — | exact $R$ | 267 fn. 2 |
| [[SRT Division]], radix 2, $\gamma{=}1$ | $w_Q$ | add/sub + sign; selection reads **3 bits of $2R_i$ and 0 bits of $D$** — no table at all | none | — | exact; $\vert R_1/D - Q_i\vert \le \rho\beta^{-i}$ | 272 |
| [[SRT Division]], radix 4, $\gamma{=}2$ | $\lceil (w_F{+}3)/2\rceil$ | selection $6{+}3 = 9$ bits in, 3 out; $\{0,\pm D,\pm 2D\}$ mux + add/sub | none | mux and add/sub merge into **one row of 6-LUTs** on the fast carry chain — no count given | exact, correctly roundable | 271, 276 |
| [[Radix-4 Maximally Redundant Divider]] ($\gamma{=}3$) | $\lceil (w_F{+}3)/2\rceil$ | selection $4{+}1 = 5$ bits in, 3 out — four input bits smaller; 4-input mux needing $3D = D + (D{\ll}1)$, hoisted out of the loop | none | seventh input per bit position **breaks** the single-LUT-row packing | exact, correctly roundable | 277-279 |
| [[Radix-64 Speculative Divider]] | $\lceil (w_F{+}3)/6\rceil$ — **10** at $w_F = 52$ | three chained radix-4 steps; selection is a 4-bit rounding on 6 bits of $\beta\widetilde R_i$; five candidate remainders per step + $5{:}1$ mux | none | — | exact | 288 |
| [[Division by Reciprocal]] | one table-or-polynomial evaluation, then one multiplication | $1/D$ block + truncated multiplier | 1 truncated mult | degree-2 piecewise polynomial is the best single-precision option on DSP-enabled FPGAs [Pas12] | faithful, $\vert\delta_Q\vert < 2^{-w_F-2}$; $\ell_Q = -w_F{-}3$, $\ell_R = -w_F{-}4$ | 289-291 |
| [[Newton-Raphson Reciprocal]] | $\lceil \log_2(w_F/\vert\ell_0\vert)\rceil$; step $= 2$ multiplier delays | exact squarer **then** truncated multiplier; datapath **doubles** every step | 1 squarer + 1 mult | — | faithful; **self-correcting** ($e_i$ re-measured against $D$) | 291-294 |
| [[Quadratic Series Divider]] | same count; step $= 1$ multiplier delay | squarer **‖** multiplier; $E$ datapath **shrinks** — 21 b in / 20 b out at step 0, **7 b in / 6 b out** at step 1, for $\ell = -32$, $m_0 = -7$ | 1 squarer ‖ 1 mult | — | faithful; $\overline\delta'_2 = 2^{-32} + 2^{-45}$; $E$ path self-corrects, $Q$ path does not | 295-299 |
| [[Goldschmidt Division]] | same count; two independent mults per step | two full-width $w{\times}w$ truncated multipliers, **no** shrinkage | 2 mults | — | faithful; **not** self-correcting — guard bits sized for accumulated error | 299-300 |
| [[Halley Reciprocal Iteration]] | $\lceil \log_3(\vert\ell\vert/\vert m_0\vert)\rceil$; step $= 3$ multiplier delays | 1 squarer + 2 multipliers; **triples** the correct bits per step | 1 squarer + 2 mults | **11-input-bit table + one step ⇒ 32-bit faithful reciprocal** on FPGA | faithful; self-correcting | 301 |
| [[VFloat Ad Hoc Series Divider]] | table read **‖** first multiplication, then the second | ROM of $2^{\vert k\vert}$ entries by $\approx 2\vert k\vert$ output bits, sized by $2k < \ell$; one narrow subtracter | 2 faithful mults, inputs "slightly larger than full significands" | attractive exactly when both multipliers fit in DSP blocks | faithful; **overall cost exceeds** one-step Newton-Raphson or quadratic series | 302 |
| [[Newton-Raphson Square Root]] | $\lceil \log_2(w_F/\vert\ell_0\vert)\rceil$; step $= 3$ multiplier delays | exact squarer + 2 multipliers in series; widths double per step | 1 squarer + 2 mults | — | faithful $1/\sqrt X$; one more multiply for $\sqrt X$ | 302-303 |

**The options.** Six of the eighteen notes are not dividers but modifications you bolt onto one, so they are priced against what they displace rather than against each other.

| Option | Displaces | Cost | Buys | p. |
| --- | --- | --- | --- | --- |
| [[Quotient Digit Selection Table]] | — it *is* the selection function | radix 4, $\gamma{=}2$: 9 inputs (6 bits $\beta R_i$, 3 bits $D$), 3 outputs; realised as **four thresholds per $D$ column**, not $2^9$ entries | digit selection without a division, on budget $\varepsilon < 2\rho - 1$ | 272-276 |
| [[Comparison-Based Digit Selection]] | the table, once $D$ may be arbitrary | 4 comparators against $\pm\frac12 D, \pm\frac32 D$ (doubled, so against $D$ and $3D$) + one adder for $3D$; **two carry propagations in sequence** for $\log_2\beta = 2$ quotient bits | high-radix division of arbitrary integers; the radix-8 non-redundant variant gets 3 bits per propagation for 8 subtracters, a priority encoder and an $8{:}1$ mux | 282-283 |
| [[Divisor Prescaling]] | the table's dependence on $D$ | 2 muxes + 1 addition, **duplicated** for $X$ and for $D$; iteration datapath $+1$ MSB and $+3$ LSBs; $R_1 = 2^{-3}X$ costs up to $3/\alpha$ extra iterations | $D_\text{scaled} \in [\frac{126}{128}, \frac{144}{128}] = [0.984, 1.125]$, so selection collapses to a **4-bit round-to-nearest** | 283-286 |
| [[On-the-Fly Quotient Conversion]] | the final $w$-bit carry-propagate subtraction | 2 quotient-width muxes + 2 quotient-width registers **per stage** | conversion by concatenation only, $O(1)$ delay | 280-282 |
| [[Carry-Save Partial Remainder]] | the carry-propagate adder inside the loop | one CSA level for a height-3 heap; a naive selection table grows from 9 to $6{+}6{+}3 = 15$ inputs, fixed by a short CPA over the leading bits; the ignored carry eats $2^t/D$ of the overlap — at $t = -4$, $6{+}3$ bits stop being enough | **zero carry propagation in the loop**; HRCS register overhead is $1/16$ at chunk size 16, not $2\times$ | 286-288 |
| [[Reciprocal Seed Table]] | — precondition for every multiplicative row | ROM on $\vert\ell_T\vert = \vert\ell_0\vert + 1$ address bits with $-\ell_0$ data bits | $0 \le e_0 < 4\cdot 2^{\ell_0}$ (nearer $3\cdot2^{\ell_0}$ once $D_0$/$R_0$ correlation is used) and $\frac12 \le R_0 < 1$, which also saves the weight-$2^0$ bit downstream | 292-294 |

> [!warning] The chapter reports no LUT counts, no slice counts, no DSP counts and no delays
> Every cell of the "LUT · DSP · ns" column is genuinely `—` except where the book makes a *structural* statement, and those are quoted as structure, not as measurements. Chapter 9 is architectural throughout: it gives iteration counts, selection-function input widths, datapath widths and error budgets, and never a synthesis result or an $f_\text{max}$ for any divider. Sizing one on a real part needs outside data or a [[FloPoCo]] run (`FPDiv wE=8 wF=23 srt=42` for $\gamma{=}2$, `srt=43` for $\gamma{=}3$, pp. 276-277). The area columns above are structural counts of adders, muxes, registers and table inputs, and nothing more.

**The first question is what comes out, not how fast, because it eliminates half the table before latency is discussed.** A digit recurrence terminates on the exact identity $R_1/D = Q_i + \beta^{-i}R_{i+1}/D$ (9.34, p. 280) — nothing was rounded anywhere — so it hands you the true remainder and correct rounding becomes a *decision* taken on $R_k$ rather than an error to be bounded. Every multiplicative method computes an approximation from the first cycle and can only ever be faithful: $|\delta_Q| < 2^{-w_F-2}$ (9.46, p. 289), correct rounding not available at any price you would pay. So if the operator must produce a remainder — integer division, modular reduction, anything where $X = QD + R$ is the specification rather than $Q \approx X/D$ — the whole lower half of the table is out, and [[Divisor Prescaling]] joins it, because prescaling returns $M(X - QD)$ and an exact remainder needs an extra division by $M$. The mirror-image constraint is the domain: reciprocal methods need $D$ bounded away from zero and assume $D \in [1,2)$, so a general fixed-point divider must be wrapped in a leading-zero count and two shifters before any of them applies (p. 288).

**Once exactness is settled, area versus latency decides among the digit recurrences, and the FPGA/ASIC fork decides the radix.** If the divider is rare and off the critical path, stop at [[Restoring Division]] — one subtracter and one mux is the floor, and $w_Q$ cycles is invisible if nothing is waiting. [[Non-Restoring Division]] is the same circuit with the mux deleted and one correction cycle added, which is a real win only where the mux was a LUT *after* the carry chain rather than a couple of gates beside it, i.e. on FPGA and not on ASIC (p. 267 fn. 2). Above roughly 16 bits the linear cycle count starts to hurt and the answer is radix, not a faster adder: [[SRT Division]] at radix 4 with $\gamma = 2$ halves the iteration count and, on a 6-LUT device, packs its multiplexer and add/sub into a single LUT row riding the fast carry chain — which is precisely why the [[Radix-4 Maximally Redundant Divider]] loses there despite its four-bits-smaller table, since $3D$ makes the per-bit function seven-input. On ASIC that quantisation does not exist, a $4{:}1$ mux is just a mux, and $\gamma = 3$'s smaller and faster selection wins instead. Pushing further is not free: radix 8 with $\gamma = 7$ is both larger and slower than either radix-4 variant (p. 277), because table area grows exponentially in the selection input while the iteration count only halves again.

**Below the last few cycles of latency the levers stop being the algorithm and start being the three options, and they compose.** [[Carry-Save Partial Remainder]] removes carry propagation from the loop entirely and is the dominant ASIC lever — a 1997 survey found divider performance only weakly sensitive to architecture but significantly improved by aggressive circuit techniques [HOH97] (p. 287), which is why radix-2 with a redundant remainder is a perfectly sane design point. On FPGA it is usually not worth it below about 32 bits, because the hard carry chain already makes a full carry-propagate remainder fast enough (p. 288). [[On-the-Fly Quotient Conversion]] earns its $2w$ muxes and $2w$ registers per stage exactly when the loop has been made carry-free and the final subtraction would be the only carry propagation left. [[Divisor Prescaling]] pays only where the table would otherwise explode — at radix 4 its 4-bit rounding adder is "not dramatically cheaper" than the 5-input table it replaces (p. 284) while the duplicated scaler and wider datapath are charged in full. Stack all three plus speculation and you get the [[Radix-64 Speculative Divider]], ten cycles for a double-precision quotient, bought entirely with area: fifteen compressor rows and three wide muxes per cycle where a plain radix-4 iteration has one adder and one small mux. [[Comparison-Based Digit Selection]] is the odd one out — it is the only route to high-radix division of *arbitrary* integers, but it puts two sequential carry propagations where restoring puts two and gets the same two quotient bits, and the book's own verdict is that it is unclear whether any context makes it worth it (p. 282). Normalising $D$ instead is a leading-zero counter and two shifters amortised over the whole division, which beats a per-cycle cost as soon as the quotient is more than a few digits long.

**Reach for a multiplicative method only when the multipliers already exist, then pick by dependency shape rather than by iteration count — they all have the same one.** Every row from [[Reciprocal Seed Table]] downward converges in $\lceil \log_2(w_F/|\ell_0|)\rceil$ steps (Halley, $\lceil\log_3(\cdot)\rceil$), so the differences are per-step depth, per-step width, and whether errors are re-measured. The diagram above is the whole distinction between the two leading candidates: [[Newton-Raphson Reciprocal]] chains an exact squarer into a truncated multiplier and grows its datapath every step, while the [[Quadratic Series Divider]] issues both at once and *shrinks* its $E$ path — 21 bits to 7 bits in two steps at $\ell = -32$ — so it is the shorter critical path at identical convergence. Newton-Raphson keeps the edge where multiplier count matters more than depth, and both are self-correcting because $e_i = 1 - Dr_i$ is re-derived from $D$ each step, which is what licenses aggressive truncation. [[Goldschmidt Division]] gives that up: $p_{j+1} = 2 - d_j$ depends only on the denominator recurrence, so a numerator rounding error is never re-observed and must be paid for in guard bits sized for the accumulated error. In exchange its two products are independent and issue in the same cycle, which is the machine it is for — deep pipelines, throughput over latency, DSP blocks already committed. Optimise away its multiplication by numbers close to 1 and you have literally recovered the quadratic series (p. 300); the full-width form survives only where the multiplier is a fixed-size hard block that costs the same either way. [[Halley Reciprocal Iteration]] fills one specific gap: it triples the seed for one squarer and two multipliers, so when the table and target sit a factor of three apart — 11 bits in, 32 out — it is exactly right and saves a third multiplier. [[VFloat Ad Hoc Series Divider]] is the small-precision-only entry, since its table is the square root of a full reciprocal table and its only accuracy knob costs exponentially. [[Newton-Raphson Square Root]] inherits everything above with one extra multiplier delay per step, which is why the Goldschmidt square-root variant [PB02] is what you want when it must pipeline. On ASIC without hard multipliers the entire family is unattractive: two large multiplies to replace what a digit recurrence does with one subtracter per cycle.

**Related Notes.**

- [[Dividers]] – depends-on: the topic note this table summarises, with every derivation behind it.
- [[Restoring Division]] – compares: the floor — one subtracter and one mux, and still right when division is rare.
- [[Non-Restoring Division]] – compares: the same recurrence minus the restore mux, plus one correction cycle.
- [[SRT Division]] – compares: the exact-remainder answer above ~16 bits, and the FPGA design point at radix 4, $\gamma = 2$.
- [[Radix-4 Maximally Redundant Divider]] – compares: four input bits smaller in the table, one LUT row larger in the datapath — the trade that reverses between FPGA and ASIC.
- [[Quotient Digit Selection Table]] – depends-on: the block whose 9-input width appears in every SRT row, and the Pentium FDIV cell.
- [[Comparison-Based Digit Selection]] – counter-example: the only route to arbitrary integers, at two sequential carry propagations for two quotient bits.
- [[Divisor Prescaling]] – extends: removes $D$ from the selection function, which is what makes very high radices possible.
- [[On-the-Fly Quotient Conversion]] – extends: deletes the final carry-propagate subtraction for $2w$ muxes and $2w$ registers per stage.
- [[Carry-Save Partial Remainder]] – extends: the dominant ASIC lever, and the reason radix-2 is still a sane design point.
- [[Radix-64 Speculative Divider]] – compares: prescaling, carry-save and speculation stacked — ten cycles for double precision, paid entirely in area.
- [[Division by Reciprocal]] – compares: the head of the second family, and the error split ($\ell_Q = -w_F{-}3$, $\ell_R = -w_F{-}4$) every row below inherits.
- [[Reciprocal Seed Table]] – depends-on: the $\ell_0$ that fixes the iteration count of every multiplicative row.
- [[Newton-Raphson Reciprocal]] – compares: squarer then multiplier, datapath doubling, self-correcting.
- [[Quadratic Series Divider]] – compares: the same convergence with the squarer in parallel and the $E$ path shrinking.
- [[Goldschmidt Division]] – counter-example: the only row that never re-measures its error, and the only one built for throughput rather than latency.
- [[Halley Reciprocal Iteration]] – extends: cubic convergence filling the gap between one and two quadratic steps.
- [[VFloat Ad Hoc Series Divider]] – compares: table read in parallel with the first multiply, worth it only when both multipliers are free DSP blocks.
- [[Newton-Raphson Square Root]] – extends: the same iteration one multiplier delay deeper, for $1/\sqrt X$ instead of $1/D$.
- [[Error Accuracy]] – depends-on: where "faithful" and "correctly rounded" are defined, and how the guard bits are counted.
- [[Number Formats]] – depends-on: the `ufix` bookkeeping every width in both tables is stated in.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 9 "Division and Square Root", pp. 259-305. Every number above is from:

- §9.2.1, pp. 266-269 — schoolbook binary division, (9.8)-(9.13), Fig. 9.4 (p. 269); the $w_D+1$ subtracter and $w_D$ mux, the latency argument and the non-restoring footnote 2 (p. 267).
- §9.2.2-9.2.3, pp. 269-271 — the radix-$\beta$ recurrence, its invariant, and $k = \lceil (w_F+3)/\alpha\rceil$ (p. 271).
- §9.2.4, pp. 272-279 — redundant digit sets (9.27)-(9.30); $\gamma = 2$ selection on $6+3$ bits, the digit encoding (9.32) and the single 6-LUT row (p. 276); $\gamma = 3$ selection on $4+1$ bits, the $3D$ multiplexer input and the lost packing (pp. 277-278); the radix-8 $\gamma = 7$ verdict and the FloPoCo don't-care limitation (pp. 276-277); Pentium FDIV, footnote 3 (p. 275).
- §9.2.5, pp. 279-280 — initialisation $R_1 = X/2$ versus $X/4$; termination (9.33)-(9.35) and why correct rounding is a decision.
- §9.2.6, pp. 280-282 — the final subtraction (9.36)-(9.37) against on-the-fly conversion (9.41)-(9.43) and its two-mux, two-register per-stage cost (p. 282).
- §9.2.7, pp. 282-283 — why the P-D tiling fails near $D = 0$; comparison against $\pm D/2$, $\pm 3D/2$ (Fig. 9.11); the radix-8 non-redundant alternative and the normalisation escape.
- §9.2.8, pp. 283-286 — Table 9.2 (p. 285), $D_\text{scaled} \in [\frac{126}{128}, \frac{144}{128}]$, the 4-bit rounding selection (Fig. 9.12b, p. 284), and the $+1$ MSB / $+3$ LSB datapath widening and extra iterations (pp. 285-286).
- §9.2.9-9.2.10, pp. 286-288 — carry-save remainder, (9.44)-(9.45) and Fig. 9.14 (p. 287); [HOH97] (p. 287); FPGA carry-chain crossover and HRCS overhead, and Bruguera's radix-64 divider [Bru18] (p. 288).
- §9.3, pp. 288-294 — the reciprocal error split (9.47)-(9.51) and the budget $\ell_Q = -w_F-3$, $\ell_R = -w_F-4$ (p. 290); [Pas12] on degree-2 piecewise polynomials (p. 291); Newton-Raphson (9.52)-(9.55) and self-correction (pp. 292-293); the seed table (9.56)-(9.62) and datapath sizing (pp. 293-294).
- §9.4, pp. 295-299 — the quadratic series (9.64)-(9.75), the parallel squarer/multiplier of Fig. 9.17b (p. 296), the $Q_i + Q_iE_i$ rewrite (p. 297), the worked sizing 21 b → 7 b (p. 298) and the two error recurrences (9.85, 9.91, pp. 298-299).
- §9.5, pp. 299-302 — Goldschmidt (9.96)-(9.101) and its collapse into the quadratic series (p. 300); Halley (9.105), the 11-bit table to 32-bit reciprocal result [IP17] (p. 301); VFloat (9.106)-(9.108) and the [Jai14] remark (p. 302).
- §9.6, pp. 302-303 — square root as a digit recurrence and Newton-Raphson on $1/x^2 - X$ (9.111), plus the Goldschmidt variant [PB02].

No RTL: this note is a comparison, not a circuit.
