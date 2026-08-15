---
title: Choosing a Function Approximation Method
description: "Trade-off table across the 11 Fixed-Point Function Approximation circuits, with the source's own numbers — and the three separate decisions that hide behind 'how do I evaluate f'."
kind: comparison
source: "ASA Ch. 16, pp. 477-495"
status: seed
spade: n/a
tags: [digital, fixed-point-function-approximation, comparison, rom, table, rounding, fpga]
aliases:
  - Choosing a Function Approximator
  - Choosing a Table Implementation
  - Function Approximation Trade-offs
  - Which Function Approximation Method
---

# Choosing a Function Approximation Method

Three independent decisions hide behind "how do I evaluate $f$": which *implementation* the table gets, which *repair* the range wrap gets, and whether the function's class lets you leave tabulation behind — and only the first is decided by input width.

**Four implementations of the same $2^{k}\times n$ table.**

| Circuit | Cost model | Concrete number the source gives | Depth / delay | Target |
| --- | --- | --- | --- | --- |
| [[Function Table ROM]] | $B = 2^{k}\cdot n$ bits | $k=n=8$: 2 048 bits · $k=n=12$: 49 152 · $k=n=16$: 1 Mibit · $k=n=24$: 48 MiB | one ROM access, combinational | both |
| [[LUT-Array Function Table]] | $\text{LUTs} = 2^{\max(k-\alpha,0)}\times n$ (p. 492) | $2^{8}\times8$ sine on $\alpha=6$: **25 LUTs measured against 32 predicted** (p. 492) | one LUT delay for $k\le\alpha$, independent of $n$ | FPGA |
| [[Synthesized Logic Table]] | $A \propto 2^{0.65\min(k,n)}\times 2^{0.19\lvert k-n\rvert}$ — Eq. (16.1), p. 491 | $k=n=4$: $2^{2.6}\approx 6$ area units against 64 stored bits (computed from 16.1, not measured) | — | ASIC |
| [[Hard ROM Macro]] | array content-independent; all logic is the $\Theta(2^{k})$ decoder (p. 491) | — ; measured **larger** than standard cells on the tabulated functions studied (p. 491) | — | ASIC |

The exponent $0.65<1$ in (16.1) is the chapter's only quantitative statement about how much logic optimisation buys: one input bit at $k=n$ costs a factor $2^{0.65}\approx1.57$ where the bit count costs more than $2$. The $0.19$ is the imbalance penalty, so one extra *output* bit multiplies ASIC area by $2^{0.19}\approx1.14$, not by $2$.

> [!warning] Every "—" above is a gap in the source, not an omission here
> Chapter 16 quotes **no delay figure, no cycle count, no DSP-block count and no gate count** for any of these. It contains exactly two measured hardware numbers: the 25 LUTs on p. 492, and the qualitative "ROM generators larger than standard cells" on p. 491 — given without an area figure, without a cost-per-bit figure, and without the table size at which that ranking would flip. Latency is uniform and therefore uninteresting: everything in this folder is combinational, one lookup deep, so a cycle-count column would read $1$ everywhere.

**Four repairs for the range wrap.** All four fix the same defect — $\mathrm{RN}(f(X))$ leaving the top of the output format and wrapping to zero, for $f=\sin(\tfrac\pi2 x)$ on $[0,1)$ in $\mathrm{ufix}(-1,-4)$ at $X=\tfrac{14}{16},\tfrac{15}{16}$ (Fig. 16.5, p. 482).

| Fix | Hardware | Error against the original $f$ | What else changes | p. |
| --- | --- | --- | --- | --- |
| [[Output Format Widening]] | one more table column: $2^{\max(k-\alpha,0)}$ LUTs on FPGA, $\times2^{0.19}\approx1.14$ on ASIC | $\le\tfrac12$ ulp — **unchanged**, still correctly rounded | 4 bits → 5 at $\ell=-4$; **8-bit in, 9-bit out** at $\ell=-8$; "almost half of the output domain is unused" — 15 of 32 codes dead | 483, 490 |
| [[Saturating Output Clamp]] | the only fix that is gates: one OR per output bit driven by $\omega=\bigvee$ guard bits — and zero gates if the operator is a ROM, since the generator edits two entries | $u/2$ everywhere except **2 inputs out of $2^{k}$**, where it is $0.693\,u$ and $0.923\,u$ — the book's "close to $1/16$: one full ulp" | format unchanged; the book hedges, saturating "may or may not incur some hardware overhead" (p. 482) | 482-483 |
| [[Round-Down Table Fill]] | none — $\mathrm{RD}$ is $\mathrm{RN}$ with the add-half step omitted, i.e. a bit slice | $0\le f-\widetilde f<u$ at **every** input; the budget doubles | format unchanged; monotonic for free, and a systematic $-u/2$ offset | 483 |
| [[Output Range Scaling]] | none — the factor $1-2^{\ell}$ is baked into the generation-time constant | $\le\tfrac12u + 2^{\ell}\lvert f\rvert \le \tfrac32 u$ — "close to 1.5 ulp" | still *perfectly* rounded, but of $(1-2^{\ell})f$; maps `00000000`→`00000000` and `11111111`→`11111111` (p. 490) | 483, 490 |

How many inputs need repairing at all, for the sine: the bad set is $\{X : f(X)\ge 1-u/2\}$, and expanding $\arcsin(1-\varepsilon)\approx\tfrac\pi2-\sqrt{2\varepsilon}$ gives a fraction $\tfrac2\pi 2^{\ell/2}$ — $2$ of $16$ at $\ell=-4$, $10$ of $256$ at $\ell=-8$, $162$ of $65536$ at $\ell=-16$. That count is **derived** from the Fig. 16.5 setup (p. 482), not quoted; the book states only the $\ell=-4$ instance. It is what decides between the last three rows, because it shrinks as precision grows.

**Three uses of a table that are not "approximate a smooth $f$".**

| Circuit | Why it is here | Number | p. |
| --- | --- | --- | --- |
| [[Tabulated Reciprocal]] | $f(x)=\tfrac2{x+1}-1$ on $[0,1)$: "both the $+1$ and $-1$ are trivial bit operations that entail no cost", and $f(0)=1$ forces exactly one extra MSB | FloPoCo `lsbIn=-8 lsbOut=-16` — 17 output bits from $2^{8}$ entries, output precision far above input precision. The worked 8-bit operator's $0.0601\approx2^{-4.06}$ worst relative error over all 255 legal inputs is that note's own exhaustive simulation, not the book's | 484, 490 |
| [[Modular Squaring Table]] | $ab \bmod p = \big(T(a{+}b)-T(\lvert a{-}b\rvert)\big)\bmod p$ — a nowhere-continuous $f$ no smoothness-based method can touch | $p=23$: two $2^{6}\times5$ tables, 640 bits, 5 LUTs each — **derived** from the p. 492 cost law, not measured | 490 |
| [[Residual-Sign Rounding Unit]] | upgrades *any* faithful algebraic approximation to correctly rounded: compute $S$ at precision $\ell-1$, and when its LSB is $1$ let $\operatorname{sign}P(S,X,Y)$ pick the neighbour | — ; the source quotes no area and no delay. Structurally one $w$-bit conditional incrementer plus a zero-detect, both absorbed into the final CPA on ASIC | 486-487 |

**Input width decides the family, and it decides it before anything else.** $B=2^{k}n$ is the whole argument. At $k\le\alpha$ a table is not merely acceptable but free — $n$ LUTs, and the $\alpha-k$ unused address bits are already paid for, so widening the input to the full $\alpha$ improves accuracy at zero cost, a rule with no ASIC counterpart because (16.1) is continuous. That regime runs out fast. By $k=12$ the table is 48 kbit and you are spending [[Block Memory]] on one function; by $k=16$ it is 1 Mibit, most of a mid-range device for one operator; at $k=24$, 48 MiB, it is not a circuit. Logic optimisation moves the wall without removing it — $2^{0.65k}$ at $k=n=16$ is still $\approx2^{10.4}$ units. Past roughly $k=12$ the answer is a different chapter: [[Table-Based Function Evaluation]] for a smaller exponential, [[Polynomial Approximation]] for coefficients instead of values, [[Digit Recurrence for Algebraic Functions]] for $\Theta(k)$ area and no table at all, bought with $\Theta(k)$ cycles.

**Inside the table regime the target decides the form, and the two targets disagree about which vice matters.** On ASIC, hand the truth table to synthesis as a Boolean function and let (16.1) apply: [[Synthesized Logic Table]] is the default, and instantiating a [[Hard ROM Macro]] is the one move that forfeits the discount — which is why the macro's very low cost per bit still lost the measured comparison, its content-independence being a virtue only for area *predictability*. On FPGA the vice is the opposite. Nothing is lost to opacity, since the mapper runs the same optimisation flow and finds the same 25-versus-32 discount; what bites is quantization. [[LUT-Array Function Table]] costs one LUT column per output bit and rounds the address up to $\alpha$, so a $2^{\alpha-1}\times n$ ROM costs exactly what a full one does. Block RAM is the FPGA's hard macro in every respect that matters here: right for tables of a few tens of kilobits, wasteful below its granularity, opaque to optimisation, and — like the ASIC macro — a way to *guarantee* the nominal cost by giving up the discount.

**The range fix is decided by who pays, not by how much.** Four repairs, and only [[Saturating Output Clamp]] is ever real hardware — and even that is free when the operator is a pure ROM, because the generator simply writes the clamped value into the two offending entries. So the choice is where the ulp goes and how far the width travels, not area. Take [[Output Format Widening]] when the half-ulp guarantee is load-bearing and the extra bit dies locally; refuse it when width is contagious, since an 8-in/9-out operator makes every downstream adder, register and second-stage table inherit the bit, and a second table's address space doubles. Take [[Output Range Scaling]] as the default: generic, free, still perfectly rounded — just of a function the caller did not name, which makes its extra ulp a systematic bias toward zero that does not average out and must be carried as a bias term in the [[Error Accuracy]] budget. Take [[Round-Down Table Fill]] only when you also want the monotonicity and determinism it throws in, because on error alone it is the worst trade here: at $\ell=-16$ it doubles the error at all $65536$ inputs to repair $162$ of them, where the clamp degrades only those $162$. And when the overshoot is a single *exact* value rather than a rounding artefact — [[Tabulated Reciprocal]]'s $f(0)=1$ — widening is the only honest answer; clamping would be a deliberate one-ulp error on a value the specification demands, and scaling would multiply a function whose entire appeal is that its constants are powers of two.

**Function class overrides all of the above, at both ends.** Tabulation's requirement list is one item long: $f$ defined and finite on its domain (p. 488). Not continuous, not differentiable, not monotonic. Every other family needs bounded derivatives or algebraicity, so for a discontinuous or table-defined function — [[Modular Squaring Table]] is the extreme, discontinuous at every multiple of $p$ — tabulation is not the cheap option but the only one, and $2^{k}n$ stops being a choice and becomes a hard limit on the problem. At the other end, if $f$ is *algebraic* the class buys something no table can: the defining polynomial evaluates exactly on finite binary inputs, so [[Residual-Sign Rounding Unit]] converts any faithful approximation into a correctly rounded one for an incrementer and a sign wire — which is why digit recurrence is the one family where correct rounding is nearly free at any precision, and why the chapter confines correct rounding of *elementary* functions to $\le24$ bits, the range where the whole table can be enumerated offline (p. 488). Below that bound, [[Function Table ROM]] has zero architectural overhead for correct rounding: choosing $\mathrm{RN}$ over $\mathrm{RD}$ changes constants, not gates.

$$\boxed{\ k\le\alpha:\ \text{tabulate, } n\ \text{LUTs, free}\quad\big|\quad k\lesssim12:\ \text{tabulate into block RAM}\quad\big|\quad k\gtrsim16:\ 2^{k}n\ \text{decides — change family}\ }$$

**Where this comparison itself breaks.**

- **Any comparison that charges saturation $W$ gates is comparing the wrong architectures.** For a ROM the clamp is table content. The OR bank exists only where the top value is *computed* — polynomial evaluator, digit recurrence, table-and-addition.
- **(16.1) is a fit over small tables.** Fix $n=1$ and let $k$ grow and it predicts $2^{0.19k}$, while Shannon's counting argument needs $\Omega(2^{k}/k)$ gates for almost every $k$-variable function. Do not extrapolate that row past the sizes it was measured on.
- **The LUT column overcounts in two directions.** Synthesis optimises (25 against 32), and real fabrics fracture — an Intel ALM or an AMD LUT6 exposes two outputs when the functions share inputs, which is exactly this case, since all $n$ slices share the entire address bus.
- **The last table has no measured numbers at all.** The reciprocal's error figure is simulated and the modular squarer's LUT count derived, each in its own note; the rounding unit has neither. Read the first two tables as sourced and the third as structural.

**Related Notes.**

- [[Fixed-Point Function Approximation]] – depends-on: the topic note this table summarises — the specification problem, and every derivation behind the rows.
- [[Function Table ROM]] – compares: the baseline every row is measured against, and the only approximator needing no smoothness at all.
- [[LUT-Array Function Table]] – compares: the FPGA unit of cost, quantized at $\alpha$ address bits, and the source of "never shrink the address".
- [[Synthesized Logic Table]] – compares: the ASIC default, and where Eq. (16.1)'s $0.65$ and $0.19$ exponents come from.
- [[Hard ROM Macro]] – counter-example: lowest cost per bit and it still measured larger, because a macro never exposes its contents to optimisation.
- [[Output Format Widening]] – compares: the range fix that keeps the half-ulp guarantee and pays in contagious width.
- [[Saturating Output Clamp]] – compares: the only range fix that becomes gates, and only when the operator is not a ROM.
- [[Round-Down Table Fill]] – compares: free and monotonic, but it taxes every input to repair a vanishing minority.
- [[Output Range Scaling]] – compares: the generic default, perfectly rounded of a modified $f$, hence $\approx1.5$ ulp of systematic bias.
- [[Tabulated Reciprocal]] – supports: the case where widening is right because the surrounding reconstruction logic eats the extra bit anyway.
- [[Modular Squaring Table]] – supports: the discontinuous function that forces tabulation whatever the cost table says.
- [[Residual-Sign Rounding Unit]] – extends: the reason function *class*, not width, decides whether correct rounding is affordable.
- [[Table-Based Function Evaluation]] – extends: where the answer goes once $k$ passes 12 and the exponential has to be bought back.
- [[Error Accuracy]] – supports: ulp, faithful versus correctly rounded, and where the scaling bias enters the downstream budget.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 16 "Generalities on Fixed-Point Function Approximation", pp. 477-495. Every number above is from:

- §16.2.1 *Range Issues and Their Solutions*, pp. 481-484 — the wrap and the four fixes; "may or may not incur some hardware overhead" (p. 482); "close to $1/16$: one full ulp" and "close to 1.5 ulp" (p. 483); the reciprocal's $+1$/$-1$ as free bit operations (p. 484). Figs. 16.5 (p. 482), 16.6 (p. 483), 16.7 (p. 484).
- §16.2.2 *Monotonicity Issue*, p. 485 — correct rounding preserves monotonicity, faithful rounding does not; the one-ulp bound on the wobble.
- §16.3.1 *Algebraic Functions*, pp. 486-487 — $P$ exact on finite binary inputs; faithful at $\ell-1$ giving correct rounding at $\ell$; Fig. 16.9 (p. 487).
- §16.3.2, p. 488 — correct rounding of elementary functions restricted to $\le24$ bits by exhaustive enumeration, and why Ziv's `while` loop does not belong in hardware.
- §16.4-16.4.1, pp. 488-490 — the one-item requirement list and no architectural overhead for a correctly rounded table (p. 488); the four hands-on generator cases including $x^{2}\bmod23$ and `lsbIn=-8 lsbOut=-16`; "exponential in the input size, but only linear in the output size"; the 8-in/9-out instance and "almost half of the output domain is unused" (p. 490).
- §16.4.2 *Actual Cost of a ROM*, pp. 491-492 — Eq. (16.1) and its $k\leftrightarrow n$ symmetry; ROM generators measured larger than standard cells; $2^{\max(k-\alpha,0)}\times n$ and the 25-LUT sine table; block RAM as the second FPGA primitive. Fig. 16.11 (p. 492).
- Gustafsson & Johansson [GJ08], as cited on p. 491 — the empirical study behind (16.1) and behind the macro-versus-standard-cell result.

No RTL: this note is a comparison, not a circuit.
