---
title: Reciprocal Seed Table
description: "A ROM on the truncated leading bits of D returning R_0 = floor(1/(D_0 + 2^lT)), which forces R_0 <= 1/D and 1/2 <= R_0 < 1 — the initial approximation every multiplicative divider starts from."
kind: circuit
source: "ASA §9.3.3, pp. 292-294"
status: seed
spade: simulated
tags: [digital, divider, reciprocal, table, rom, fpga]
aliases:
  - Reciprocal Table
  - Initial Reciprocal Approximation
  - Reciprocal Seed
  - Reciprocal ROM
  - Initial Approximation Table
---

# Reciprocal Seed Table

A ROM addressed by the leading fraction bits of a normalised divisor whose stored value is deliberately *biased low* — $R_0 \le 1/D$ — because the sign of the initial error, not just its size, is what the multiplicative iterations that follow are built on.

```tikz title="Reciprocal seed table: truncate D to its leading bits, read R_0 from a ROM"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- the normalised divisor arrives full width ---
  \node[anchor=south] at (0,7.15) {$D \in [1,2)$};
  \draw[->,line width=0.9pt] (0,7.1) -- (0,6.35);
  \node[anchor=east] at (-0.12,6.72) {$\mathrm{ufix}(0,-w_F)$};
  \node[anchor=west] at (0.12,6.72) {$1{+}w_F$ bits};

  % --- truncation box: drop every bit below weight 2^{l_T} ---
  \draw (-0.3,5.75) rectangle (0.3,6.35);
  \node at (0,6.05) {$\mathsf{T}$};

  \draw[->,line width=0.9pt] (0,5.75) -- (0,5.0);
  \node[anchor=east] at (-0.12,5.38) {$\mathrm{ufix}(0,\ell_T)$};
  \node[anchor=west] at (0.12,5.55) {$D_0$};
  \node[anchor=west] at (0.12,5.18) {$-\ell_T$ address bits};

  % --- the ROM ---
  \draw[line width=0.9pt] (-1.35,3.9) rectangle (1.35,5.0);
  \node at (0,4.68) {recip.\ table};
  \node at (0,4.22) {$2^{-\ell_T}$ entries};

  \draw[->,line width=0.9pt] (0,3.9) -- (0,3.05);
  \node[anchor=east] at (-0.12,3.6) {$\mathrm{ufix}(-1,\ell_0)$};
  \node[anchor=west] at (0.12,3.6) {$-\ell_0$ bits, no weight-$2^0$ bit};

  \node[anchor=north] at (0,3.0) {$R_0 = \left\lfloor \dfrac{1}{D_0 + 2^{\ell_T}} \right\rfloor_{\ell_0} \in [1/2,\,1)$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.16a, p. 292.*

**The seed exists because quadratic convergence is conditional.** [[Newton-Raphson Reciprocal]] squares the reciprocal remainder $e_i = 1 - Dr_i$ at every step, $e_{i+1} = e_i^2$ (9.55), and squaring only shrinks a number when $|e_0| < 1$. A seed is therefore not an optimisation but a precondition: without one the recurrence diverges. Everything else in this note follows from wanting two more things on top of $|e_0| < 1$ — that $e_0$ be *one-signed*, and that $\ell_0$, the LSB of $R_0$, be as coarse as the iteration count can tolerate, since the table's area is exponential in its input width.

**Truncate $D$ because anything else costs an adder.** With $D \in [1,2)$ held as $\mathrm{ufix}(0,-w_F)$, the cheapest possible table input is a plain wire cut,

$$D_0 = \lfloor D \rfloor_{\ell_T} \in \mathrm{ufix}(0,\ell_T) \tag{9.56}$$

for a parameter $\ell_T < 0$ fixed later. That is the $\mathsf{T}$ box in the diagram and it is free in hardware — no rounding logic, no carry. The address is only $-\ell_T$ bits wide, not $1-\ell_T$: normalisation pins the weight-$2^0$ bit of $D$ to $1$, so it is a constant and never reaches the ROM. Depth $2^{-\ell_T}$, and $1 \le D_0 \le D \le 2 - 2^{\ell_T}$.

**Truncation pushes the reciprocal the wrong way, so bump the denominator.** $D_0 \le D$ gives $1/D_0 \ge 1/D$, an *over*-estimate, and an over-estimate makes $e_0 = 1 - DR_0$ negative. The repair is to tabulate the reciprocal not of $D_0$ but of $D_0 + 2^{\ell_T}$, which by construction of the floor is a strict upper bound on $D$:

$$R_0 = \left\lfloor \frac{1}{D_0 + 2^{\ell_T}} \right\rfloor_{\ell_0} \tag{9.57}$$

Monotonicity of $x \mapsto 1/x$ on the positives turns $D < D_0 + 2^{\ell_T}$ into $1/(D_0+2^{\ell_T}) < 1/D$, and the outer floor to $\ell_0$ only moves the value further down, so $R_0 \le 1/D$ holds unconditionally — both truncations bias the same way, which is exactly why $R_0$ is *not* a faithful approximation of $1/D$ and is not meant to be.

**The same bump fixes the output format.** $D_0 + 2^{\ell_T} \in (1, 2]$, so its reciprocal lies in $[1/2, 1)$ and the floor keeps it there: $1/2 \le R_0 < 1$. The weight-$2^0$ bit is therefore known to be zero and is not stored, and the weight-$2^{-1}$ bit is known to be one — the ROM word is $\mathrm{ufix}(-1,\ell_0)$, $-\ell_0$ bits, with a constant leading one you may also drop if the consumer knows it. This is the same normalisation the exponent path in a [[Floating-Point Operators]] divider wants, and it is the reason the book notes $e_i \ge 0 \Rightarrow r_i \le 1/D$ *saves the weight-zero bit of $R$* in the whole iteration downstream (p. 292), not just in the table.

**Split $e_0$ along the two truncations and bound each piece.** Insert the exact intermediate $(D_0 + 2^{\ell_T})R_0$ into $e_0 = 1 - DR_0$ and regroup — add and subtract the same term, then factor:

$$e_0 = \underbrace{(D_0+2^{\ell_T})}_{\le\,2}\underbrace{\left(\frac{1}{D_0+2^{\ell_T}} - R_0\right)}_{<\,2^{\ell_0}} \;+\; \underbrace{(D_0 - D + 2^{\ell_T})}_{<\,2^{\ell_T}}\underbrace{R_0}_{<\,1} \tag{9.58–9.61}$$

The first factor is bounded by $D_0 + 2^{\ell_T} \le 2$ from (9.56); the second is the floor-to-$\ell_0$ error, below one ulp of the table word by definition of $\lfloor\cdot\rfloor_{\ell_0}$; the third is $\le 2^{\ell_T}$ because $D - D_0 \ge 0$; the fourth is the range just established. Multiplying out,

$$0 \le e_0 < 2\cdot 2^{\ell_0} + 2^{\ell_T} \tag{9.62}$$

**Choose $\ell_T = \ell_0 + 1$ and the two error sources cost the same.** That makes $2^{\ell_T} = 2\cdot 2^{\ell_0}$, so neither truncation dominates and $0 \le e_0 < 4\cdot 2^{\ell_0}$: the seed is good to about $-\ell_0 - 2$ bits, from a table with one address bit fewer than its data word. Making $\ell_T$ finer than that doubles the ROM to shave a term that is already the smaller half of the budget; making it coarser lets the input truncation swamp the stored precision. The bound (9.62) is pessimistic because it ignores the correlation between $D_0$ and $R_0$ — the two cannot be maximal in (9.60) simultaneously, since a large $D_0$ forces a small $R_0$ — and the true bound is nearer $3\cdot 2^{\ell_0}$ (p. 293). The $-\ell_0 = 5$, $-\ell_T = 4$ table in the RTL below measures a worst case of $2.75\cdot 2^{\ell_0}$ over all 256 divisors, consistent with both.

> [!note] The sign of $e_0$ is the product, not its magnitude
> A correctly-rounded table would give a *smaller* $|e_0|$ for the same width, and if all you wanted was accuracy you would build one. What (9.57) buys instead is $e_0 \ge 0$, which propagates: $e_{i+1} = e_i^2 \ge 0$ for every subsequent step, so $R_i \le 1/D$ forever, so no iterate ever needs a weight-$2^0$ bit and no iterate ever overshoots into a range the following multiplier was not sized for. One-sidedness is a structural property of the datapath, bought once, in the ROM.

**Sizing against the iteration count.** $\ell_0$ is the parameter the whole multiplicative divider is dimensioned from: accuracy doubles per step, so target $\ell_{i+1} \approx 2\ell_i$ and $\delta_i \approx 2^{\ell_i}$, and the number of iterations to reach a target $\ell$ is $\lceil \log_2(\ell/\ell_0) \rceil$ (p. 294). Each iteration saved costs roughly a doubling of the table, which is the whole trade. Concretely, with a cubically-convergent [[Halley Reciprocal Iteration]] an 11-input-bit table plus a single step reaches a 32-bit faithful reciprocal on an FPGA (p. 301); [[Quadratic Series Divider]] and [[Goldschmidt Division]] consume the identical $R_0$ with the identical guarantees, since all three define $e_0 = 1 - R_0D$ the same way.

**One table can absorb the next operator.** Newton-Raphson's first step needs $R_0^2$, so a naive build puts a squarer — or worse, a second table — behind the first. Since both are functions of the same $-\ell_T$-bit address, it is strictly better to tabulate $D_0 \mapsto R_0^2$ directly in a second ROM read in *parallel* with the first, rather than in series: same total table cost, one table latency saved (p. 294). The general version of this move, and the way out when the address grows past what a single ROM can hold, is [[Table-Based Function Evaluation]]; [[Multipartite Methods]] is the specific decomposition that trades one large table for several small ones plus an adder, and is what makes a 12-to-16-bit seed affordable.

**FPGA mapping is where the seed is cheapest.** At $-\ell_T \le 6$ the table is one LUT per output bit — a 6-input LUT *is* a 64-entry 1-bit ROM, so a 64-entry 7-bit seed is 7 LUTs and no memory at all (see [[Lookup-Tables]]). Past that, distributed RAM covers a few hundred entries, and beyond roughly $2^{10}$ entries the table belongs in [[Block Memory]], which changes the circuit's character: a BRAM read is registered, so the seed stops being combinational and adds a cycle of latency the ASIC version does not have. On ASIC the same table is a synthesised gate-level ROM whose depth costs delay logarithmically rather than in discrete jumps, so there is no cliff — which is why the FPGA-specific answer is often to stop growing the table and buy the missing bits with a polynomial in a DSP block instead ([Pas12], p. 291).

$$\boxed{\ R_0 = \left\lfloor \frac{1}{\lfloor D\rfloor_{\ell_T} + 2^{\ell_T}} \right\rfloor_{\ell_0},\qquad \tfrac12 \le R_0 < 1,\qquad 0 \le e_0 = 1 - DR_0 < 2\cdot2^{\ell_0} + 2^{\ell_T}\ }$$

**When it breaks.**

- $D$ must be normalised to $[1,2)$. On a floating-point significand this is free; on an integer or fixed-point divisor it costs a leading-zero count and a [[Shifters|barrel shifter]] first, and the shift amount has to be undone on the quotient's exponent.
- Table area is $2^{-\ell_T} \times (-\ell_0)$ bits — exponential in the seed's accuracy. Every extra correct bit of $R_0$ doubles the ROM while saving at most a fraction of one iteration, so past about 10-12 address bits the table stops being the cheap option and [[Multipartite Methods]] or a degree-2 polynomial takes over.
- $R_0$ is *not* faithful, by design. Any error analysis downstream that assumes $|\delta_{\text{recip}}| < \text{ulp}$ is wrong by a factor of about 4 here; use (9.62) directly. If the reciprocal is instead tabulated to full precision and correctly rounded, the budget in [[Division by Reciprocal]] relaxes from $\ell_R = -w_F-4$ to $-w_F-3$ — but that table is only affordable at small $w_F$. See [[Rounding]].
- $D = 1$ exactly is the worst case for the bump: the $+2^{\ell_T}$ is pure loss there, since no truncation occurred, and $e_0$ eats nearly its whole budget.
- The seed guarantees nothing about $D = 0$; the exception is detected outside, before normalisation.
- The bound assumes exact arithmetic downstream. A truncated squarer in the first iteration destroys the "twice as accurate" property the seed was sized for — see the exact-squarer rule in [[Squarers and Integer Powers]].

**RTL (Spade).** The table with $\ell_T = -4$, $\ell_0 = -5$ — 16 entries of 5 bits — with the truncation box in front of it:

```spade
/// Reciprocal seed for a normalised divisor D = 1.dfrac in [1,2).
/// Truncation box: keep the top -l_T = 4 fraction bits, giving D_0.
/// ROM: R_0 = floor_{l_0}( 1 / (D_0 + 2^{l_T}) ), l_0 = -5, so the result
/// carries weights 2^-1 .. 2^-5 and lies in [16,31] == [1/2, 1).
fn recip_seed(dfrac: uint<8>) -> uint<5> {
    let rom: [uint<5>; 16] = [30, 28, 26, 25, 24, 23, 22, 21,
                              20, 19, 18, 18, 17, 17, 16, 16];
    rom[dfrac.as_bits()[4..8].as_uint()]
}
```

`dfrac` is the $w_F = 8$ fraction bits of $D$ entering at the top of the diagram, the implicit leading one never appearing in the circuit. `.as_bits()[4..8]` *is* the $\mathsf{T}$ box: index 0 is the LSB, so the slice keeps weights $2^{-1}\dots2^{-4}$ and drops the rest — pure wiring, no logic. The entry at address $a$ is $\lfloor 512/(17+a)\rfloor$, which is (9.57) with both sides scaled by $2^{5}$ and $2^{4}$. Every entry is $\ge 16$, i.e. the weight-$2^{-1}$ bit is set in all sixteen words, which is the $R_0 \ge 1/2$ guarantee visible as a constant column; synthesis will notice that column is constant and delete it, so the real ROM is 16×4 bits and the MSB is a tie-high — the one thing the drawing's "$-\ell_0$ bits" does not show.

Simulated with `.zettel/sim.sh`: 3262 vectors, exhaustive over all 256 inputs plus named asymmetric cases ($D = 1$, $D = 1{+}2^{-8}$, $D = 1.5$, $\mathtt{0x0F}$ and $\mathtt{0xF0}$ — the two nibble-asymmetric ones that catch a swapped address slice) plus a 3000-vector `$random` sweep. Each vector checks four things: the value against the behavioural $512/(17+a)$, $R_0 \ge 1/2$, $e_0 \ge 0$ via $R_0(256+\mathtt{dfrac}) \le 8192$, and the (9.62) bound $e_0 < 4\cdot2^{\ell_0}$. All pass; the measured worst case is $e_0 = 2.75\cdot 2^{\ell_0}$ at $D = 1.125$.

**Related Notes.**

- [[Newton-Raphson Reciprocal]] – supports: consumes $R_0$ and squares $e_0$; the $|e_0|<1$ this table guarantees is that iteration's convergence condition.
- [[Quadratic Series Divider]] – supports: same $e_0 = 1 - R_0D$, but expands it as a product of factors instead of a recurrence.
- [[Goldschmidt Division]] – supports: same seed, and the one consumer where the seed's one-sidedness is not enough, because nothing downstream re-measures the error against $D$.
- [[Halley Reciprocal Iteration]] – compares: cubic convergence lets a smaller table reach the same precision, moving the area from ROM to multipliers.
- [[Division by Reciprocal]] – depends-on: the $\ell_R$ error budget this table's $\ell_0$ has to fit inside.
- [[Table-Based Function Evaluation]] – extends: the general machinery for $1/x$ on $[1,2)$, of which this is the degree-0 special case.
- [[Multipartite Methods]] – extends: what replaces one ROM when $-\ell_T$ grows past what a single table can hold.
- [[Block Memory]] – depends-on: where the table lives on FPGA once it outgrows LUTs, at the price of a registered read.
- [[Rounding]] – compares: a correctly-rounded seed is more accurate and strictly worse here, because it loses $e_0 \ge 0$.
- [[Divisor Prescaling]] – compares: the SRT-side use of an approximate reciprocal, multiplying both operands by it rather than seeding an iteration.
- [[Choosing a Divider]] – compares: where the table-plus-multiplier family beats a digit recurrence at all.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.3.3 Newton-Raphson reciprocal: initial approximation, (9.56)-(9.57), Fig. 9.16a, p. 292; the $e_0$ decomposition (9.58)-(9.62), the choice $\ell_T = \ell_0+1$ and the $3\cdot2^{\ell_0}$ correlation remark, p. 293; datapath sizing guidelines and the tabulate-$R_0^2$ optimisation, p. 294.
- §9.3.1 reciprocal error budget $\ell_R$, and the correctly-rounded-table relaxation, p. 290.
- §9.3.2 generic approximation of $1/x$ on $[1,2)$, degree-2 polynomial on DSP-enabled FPGAs [Pas12], p. 291.
- §9.5.1 Halley iteration, 11-input-bit table plus one step for a 32-bit faithful reciprocal [IP17], p. 301.
