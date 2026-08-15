---
title: Division by Reciprocal
description: "Approximate 1/D then multiply by X — one table-or-polynomial block and one truncated multiplier, faithful only, and only usable when D is bounded away from zero."
kind: circuit
source: "ASA §9.3–9.3.2, pp. 288-291"
status: seed
spade: simulated
tags: [digital, divider, reciprocal, multiplicative, fpga]
aliases:
  - Reciprocal Division
  - Division Using Multiplication by the Reciprocal
  - Multiply-by-Reciprocal Divider
  - Reciprocal-Based Divider
---

# Division by Reciprocal

Division performed as $Q = X \cdot R$ with $R \approx 1/D$ produced by a separate approximation block — the only divider family that never forms a remainder, and therefore the only one whose accuracy has to be budgeted rather than being exact by construction.

```tikz title="Divider built from a reciprocal approximation and one truncated multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]
  % --- sources -------------------------------------------------------------
  \node[anchor=south] at (0.6,4.25) {$X \in [1,2)$};
  \node[anchor=south] at (3.8,4.25) {$D \in [1,2)$};

  % --- reciprocal block ----------------------------------------------------
  \draw[->] (3.8,4.2) -- (3.8,3.45);
  \node[draw, thick, minimum width=1.5cm, minimum height=0.85cm] at (3.8,3.0)
       {$1/D$};
  \node[anchor=west, font=\footnotesize] at (3.95,3.9)
       {\texttt{ufix(0,$-w_F$)} : $w_F{+}1$ b};

  % --- reciprocal output ---------------------------------------------------
  \draw[->] (3.8,2.575) -- (3.8,2.0) -- (3.0,2.0) -- (3.0,1.65);
  \node[anchor=west, font=\footnotesize] at (3.95,2.35)
       {\texttt{ufix(0,$\ell_R$)} : $|\ell_R|{+}1$ b};
  \node[anchor=west, font=\footnotesize] at (3.95,1.95)
       {$R \in [\tfrac12,1]$};

  % --- X path --------------------------------------------------------------
  \draw[->] (0.6,4.2) -- (0.6,2.4) -- (2.2,2.4) -- (2.2,1.65);
  \node[anchor=west, font=\footnotesize] at (0.75,3.55)
       {\texttt{ufix(0,$-w_F$)}};
  \node[anchor=west, font=\footnotesize] at (0.75,3.15)
       {$w_F{+}1$ b};

  % --- truncated multiplier ------------------------------------------------
  \node[draw, thick, minimum width=1.5cm, minimum height=0.85cm] at (2.6,1.2)
       {$\times$};
  \node[anchor=east, font=\footnotesize] at (1.75,1.2) {truncated};

  % --- quotient ------------------------------------------------------------
  \draw[->] (2.6,0.775) -- (2.6,0.15);
  \node[anchor=west, font=\footnotesize] at (2.75,0.5)
       {\texttt{ufix(0,$\ell_Q$)} : $|\ell_Q|{+}1$ b};
  \node[anchor=north] at (2.6,0.1) {$Q \in [\tfrac12,2)$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.15, p. 289.*

**Fix the domain before designing anything.** Fixed-point reciprocal approximation is impossible when $D$ may approach zero: $1/D$ is unbounded, so no `ufix` format holds it, and its derivative $-1/D^2$ is unbounded, so no table with a fixed number of entries approximates it to a fixed absolute error. The whole family therefore assumes $D \in [1,2)$ — a normalized significand — and, since the intended application is the significand path of a floating-point divider, $X \in [1,2)$ as well (p. 288). Both are `ufix(0, -w_F)`, i.e. $w_F + 1$ bits: one integer bit that is always 1, and $w_F$ fraction bits. A general fixed-point divider can still be built on this core by wrapping it in fix-to-float and float-to-fix conversion, which is a leading-zero counter plus two shifters — see [[Number Formats]].

**Split the error at the exact intermediate.** The quantity you can bound is not $Q - X/D$ directly but its two independent contributors, so add and subtract the exact product $XR$ (adding zero) and factor $X$ out of the second group by distributivity:

$$\delta_Q \;=\; Q - \frac{X}{D} \;=\; \underbrace{\big(Q - XR\big)}_{\delta_{\text{mult}}} \;+\; \underbrace{X\Big(R - \frac{1}{D}\Big)}_{X\,\delta_{\text{recip}}} \tag{9.47--9.49}$$

$\delta_{\text{mult}}$ is everything the multiplier does wrong given a perfect $R$; $\delta_{\text{recip}}$ is everything the $1/D$ block does wrong given a perfect multiplier. Triangle inequality gives $|\delta_Q| \le |\delta_{\text{mult}}| + |X|\,|\delta_{\text{recip}}|$ (9.50), and $|X| < 2$ on the normalized domain gives the bound the datapath is sized against:

$$|\delta_Q| < |\delta_{\text{mult}}| + 2\,|\delta_{\text{recip}}| \tag{9.51}$$

> [!note] The reciprocal must always be one bit more accurate than the quotient
> The factor 2 in (9.51) is not slack — it is $X$'s range leaking into the error budget. Any error in $R$ is amplified by up to $2\times$ before it reaches $Q$, so the $1/D$ block is permanently held to a tighter target than the operator it feeds. That single factor is why the reciprocal path, not the multiplier, dominates the cost of this family.

**Spend the budget against the faithful target.** The accuracy goal inherited from the floating-point divider is $|\delta_Q| = |Q - X/D| < 2^{-w_F-2}$ (9.46, p. 289) — faithful rounding, in the sense of [[Error Accuracy]]. Assume a faithful truncated multiplier, $|\delta_{\text{mult}}| < 2^{\ell_Q}$, and a faithful reciprocal, $|\delta_{\text{recip}}| < 2^{\ell_R}$. Substituting into (9.51) requires $2^{\ell_Q} + 2\cdot 2^{\ell_R} \le 2^{-w_F-2}$, which the book satisfies by splitting the budget in half:

$$\ell_Q = -w_F - 3, \qquad \ell_R = -w_F - 4$$

Three guard bits below the target ulp on the quotient, four on the reciprocal (p. 290). If the reciprocal is *tabulated* rather than computed, it can be **correctly** rounded instead of merely faithful — its error halves to $\le 2^{\ell_R - 1}$ — and $\ell_R = -w_F - 3$ suffices for the same $|\delta_Q|$.

**Read the widths straight off the formats.** $R$ lands in $[\tfrac12, 1]$, so its format is `ufix(0, ℓ_R)`: $|\ell_R| + 1$ bits. $Q$ lands in $[\tfrac12, 2)$, so `ufix(0, ℓ_Q)`: $|\ell_Q| + 1$ bits. That $Q$ needs no bit of weight $2^1$ is worth checking rather than assuming, because $Q$ is an *approximation* and could in principle overshoot: the largest exact quotient occurs at $X = 2 - 2^{-w_F}$ (the largest significand) over $D = 1$, giving $2 - 2^{-w_F}$, and adding an error smaller than $2^{-w_F-2}$ cannot reach 2 (p. 289).

**Buy back the reciprocal's MSB.** $R$'s bit of weight $2^0$ exists solely to represent $R = 1$, which happens only for $D = 1$ — one input out of $2^{w_F}$, paying a full extra bit on a multiplier input. Return $1 - 2^{-w_F-4}$ for that input instead and $R$ fits `ufix(-1, -w_F-4)`. Strictly, the $1/D$ block is then no longer faithful at $D=1$: its error reaches $2^{-w_F-4}$, which is the boundary rather than inside it. The full divider still comes in under $2^{-w_F-2}$, so the block-level violation is invisible at the operator level (p. 290). Note that [[Newton-Raphson Reciprocal]] gets this bit for free from a different direction — its reciprocal remainder $e_i = 1 - DR_i$ is non-negative from the first iteration on, so $R_i \le 1/D$ always.

**Or round at the end, and pay for it on the wrong side.** The alternative architecture builds a faithful divider to $\ell_Q = -w_F-2$ and adds a final round-to-nearest. The final rounding contributes its own $2^{-w_F-3}$, so the error budget for the block in the diagram tightens from $2^{-w_F-2}$ to $2^{-w_F-3}$: one more bit on $\ell_Q$ *and* one more on $\ell_R$. The rounding itself is free — it merges into the multiplier's compressor tree as a constant addend, see [[Truncated Multipliers]] and [[Rounding]] — but the extra reciprocal bit widens a *multiplier input*, which costs more than the extra output bit it saves. In a floating-point divider that output bit is only a multiplexer input (p. 290).

**Fill the $1/D$ box with generic machinery.** $1/x$ on $[1,2)$ is an ordinary unary function on a bounded interval, so nothing reciprocal-specific is required: [[Table-Based Function Evaluation]] and [[Polynomial Approximation]] both apply directly, and the range reduction those methods usually need is already done by the normalization. Their relevance depends on what the target has. Pasca found a **degree-2 piecewise polynomial** the most attractive single-precision option on DSP-enabled FPGAs, where the multiplications are free in [[DSP Blocks]]; for double precision the reciprocal-specific iterations — [[Newton-Raphson Reciprocal]], [[Quadratic Series Divider]], [[Goldschmidt Division]] — beat the generic methods, because a flat table's size is exponential in $w_F$ and a polynomial's degree climbs (p. 291). On ASIC without hard multipliers the whole family is unattractive: two large multiplies to replace what a digit recurrence does with one subtractor per cycle.

$$\boxed{\ |\delta_Q| \;<\; |\delta_{\text{mult}}| + 2|\delta_{\text{recip}}| \;\;\Longrightarrow\;\; \ell_Q = -w_F-3,\quad \ell_R = -w_F-4\ }$$

**When it breaks.**

- **$D$ near zero.** Unnormalized fixed-point inputs break the block outright. Prepend a leading-zero counter and shifters, or use a digit recurrence.
- **No remainder, ever.** $R = X - QD$ is not produced, so correct rounding needs an extra multiply-and-compare. If the specification says "correctly rounded", [[SRT Division]] gives it free.
- **The budget assumes both blocks are faithful.** Substitute a *truncated* squarer or a non-faithful table and (9.51) no longer bounds anything; the analysis has to be redone from the actual block errors.
- **$w_F$ beyond roughly 12–16 bits.** A flat reciprocal table is $2^{w_F}$ entries. Past that the $1/D$ box must become a polynomial or an iteration, and this note stops being a complete circuit — it becomes the wrapper around one.
- **No spare multiplier.** The moment you have to *build* the multipliers, restoring or non-restoring division wins on area and this family wins nothing.

**RTL (Spade).** A complete instance of the diagram at $w_F = 4$, with the reciprocal tabulated over all $2^4$ values of $D$ — the correctly-rounded case, so $\ell_R = \ell_Q = -w_F - 3 = -7$.

```spade
// Reciprocal table for D = (16 + d)/16 in [1,2), w_F = 4.
// Stores R = r/128 with r = round(128/D): correctly rounded to l_R = -7.
fn recip_table(d: uint<4>) -> uint<8> {
    match d {
        0  => 128, 1  => 120, 2  => 114, 3  => 108,
        4  => 102, 5  => 98,  6  => 93,  7  => 89,
        8  => 85,  9  => 82,  10 => 79,  11 => 76,
        12 => 73,  13 => 71,  14 => 68,  _  => 66,
    }
}

entity div_recip(x: uint<5>, d: uint<4>) -> uint<8> {
    let r = recip_table(d);
    let p: uint<16> = zext::<5, 8>(x) * r;   // exact product, ulp 2^-11
    trunc(p >> 4)                            // truncate to ulp 2^-7
}
```

`d` is the fraction field of $D$, so the $1/D$ input wire is $D$'s $w_F$ *fraction* bits only — the integer bit is the constant 1 and never reaches the table. `x` is the full `ufix(0,-4)` word, $w_F+1 = 5$ bits, matching the left-hand wire; the output is `ufix(0,-7)`, $|\ell_Q|+1 = 8$ bits, matching the bottom wire. Widths follow the cheat sheet's growth rules: `*` on two `uint<8>` yields `uint<16>` holding the exact product at ulp $2^{-11}$, and `>> 4` then `trunc` discards the four low columns — that discard *is* the $\delta_{\text{mult}} < 2^{\ell_Q}$ truncation. The block is purely combinational; a pipelined divider registers between the table and the multiplier. Synthesis will differ from the drawing in one place: this writes the full $8\times8$ product and throws four columns away, whereas a real [[Truncated Multipliers|truncated multiplier]] never builds those columns and adds a compensation constant instead.

Simulated exhaustively over all $16 \times 16$ inputs plus a random sweep — 3262 vectors — against the faithfulness specification itself rather than a copy of the table: $|Q - X/D| < 2^{-6}$, checked in integers as $|q(16+d) - 128x| < 2(16+d)$.

**Related Notes.**

- [[Choosing a Divider]] – compares: where the multiplicative family sits against the digit recurrences on latency, area and rounding.
- [[SRT Division]] – counter-example: produces an exact remainder and a correctly rounded quotient, which this architecture structurally cannot.
- [[Reciprocal Seed Table]] – depends-on: the tabulated $1/D$ that fills the box for small $w_F$, and the seed for every iteration below.
- [[Newton-Raphson Reciprocal]] – extends: replaces the box with a self-correcting quadratic iteration when a table is too large.
- [[Quadratic Series Divider]] – extends: folds $X$ into the recurrence so the $X$ multiplication disappears into the first step.
- [[Goldschmidt Division]] – extends: drives $d_i \to 1$ with two coupled recurrences instead of approximating $1/D$ explicitly.
- [[Truncated Multipliers]] – depends-on: supplies the $|\delta_{\text{mult}}| < 2^{\ell_Q}$ the budget assumes.
- [[Table-Based Function Evaluation]] – supports: generic construction of the $1/D$ block.
- [[Polynomial Approximation]] – supports: the degree-2 piecewise form that wins at single precision.
- [[Error Analysis]] – supports: the faithful/correctly-rounded distinction the guard-bit count turns on.
- [[DSP Blocks]] – supports: the hard multipliers that make this family cheaper than a digit recurrence on FPGA.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 9, "Fixed-Point Division".

- §9.3 domain restriction to $D \in [1,2)$, floating-point context, ad hoc fixed-point wrapping, p. 288.
- §9.3.1 accuracy goal (9.46) and Fig. 9.15 with its `ufix` annotations, including the argument that $Q$ cannot reach 2, p. 289.
- §9.3.1 error decomposition (9.47)–(9.51), the guard-bit choice $\ell_Q = -w_F-3$ / $\ell_R = -w_F-4$, the correctly-rounded-table variant, the saved MSB of $R$, and the round-at-the-end alternative, p. 290.
- §9.3.2 reciprocal by generic approximation, Pasca's degree-2 piecewise polynomial [Pas12], p. 291.
