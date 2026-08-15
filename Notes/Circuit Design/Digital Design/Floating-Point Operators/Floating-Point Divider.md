---
title: "Floating-Point Divider"
description: "A normalized divisor removes the singularity at zero, so all that is left is exponent management: the -1 for the possible left normalization is folded into the bias by replacing the LSB of E0 with the quotient's leading bit — a wire, not an adder."
kind: circuit
source: "ASA §11.3, pp. 347-352"
status: seed
spade: simulated
tags: [digital, floating-point, divider, rounding, exponent, fpga]
aliases:
  - FP Divider
  - FPDiv
  - Floating-Point Division
  - Baseline Floating-Point Divider
  - Faithful Floating-Point Divider
---

# Floating-Point Divider

The one floating-point operator whose significand path is *easier* than its fixed-point counterpart, because normalized operands guarantee $M_Y \in [1,2)$ and so remove the near-zero divisor that dominates fixed-point division — leaving exponent bookkeeping as the entire remaining design problem.

```tikz title="Baseline floating-point divider datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize]
  % ---- blocks ----
  \draw (0.6,8.2) rectangle (9.4,9.0); \node at (5.0,8.6) {unpack \& exception handling};
  \draw (0.6,6.6) rectangle (3.2,7.3); \node at (1.9,6.95) {$-$};
  \draw (4.6,5.4) rectangle (8.4,7.6); \node at (6.5,6.5) {\large $/$};
  \draw (4.6,3.9) rectangle (8.4,4.6); \node at (6.5,4.25) {1-bit normalization};
  \draw (0.6,3.9) rectangle (3.6,4.6); \node at (2.1,4.25) {$+\,E_0-1+q_0$};
  \draw (0.6,2.5) rectangle (8.4,3.2); \node at (4.5,2.85) {rounding adder};
  \draw (0.2,1.2) rectangle (9.4,1.9); \node at (4.8,1.55) {exception handling \& pack};

  % ---- inputs ----
  \draw[-latex] (3.5,9.8) -- (3.5,9.0); \node[anchor=south] at (3.5,9.85) {$X$};
  \draw[-latex] (6.5,9.8) -- (6.5,9.0); \node[anchor=south] at (6.5,9.85) {$Y$};

  % ---- sign path ----
  \node[draw,circle,inner sep=1.5pt] (xr) at (-1.7,8.6) {$\oplus$};
  \draw (0.6,8.80) -- (-1.7,8.80) -- (-1.7,8.78);
  \draw (0.6,8.40) -- (-1.7,8.40) -- (-1.7,8.42);
  \node[anchor=south] at (-0.3,8.85) {$s_X$};
  \node[anchor=north] at (-0.3,8.35) {$s_Y$};
  \draw[-latex] (-1.7,8.35) -- (-1.7,1.55) -- (0.2,1.55);
  \node[anchor=west] at (-1.65,5.2) {$s_R$};

  % ---- exception bus ----
  \draw (9.4,8.6) -- (10.1,8.6);
  \draw[-latex] (10.1,8.6) -- (10.1,1.55) -- (9.4,1.55);
  \node[anchor=west] at (10.15,8.6) {exceptions};

  % ---- exponent path ----
  \draw[-latex] (1.3,8.2) -- (1.3,7.3); \node[anchor=east] at (1.25,7.75) {$E_X$};
  \draw[-latex] (2.5,8.2) -- (2.5,7.3); \node[anchor=west] at (2.55,7.75) {$E_Y$};
  \draw[-latex] (1.9,6.6) -- (1.9,4.6); \node[anchor=west] at (1.95,5.9) {$1+w_E$};

  % ---- significand path ----
  \draw[-latex] (5.4,8.2) -- (5.4,7.6); \node[anchor=east] at (5.35,7.95) {$M_X$};
  \draw[-latex] (7.4,8.2) -- (7.4,7.6); \node[anchor=west] at (7.45,7.95) {$M_Y$};
  \node[anchor=east] at (5.30,7.70) {\tiny ufix$(0,-w_F)$};
  \draw[-latex] (6.5,5.4) -- (6.5,4.6);
  \node[anchor=west] at (6.6,5.0) {$Q$};
  \node[anchor=east] at (6.4,5.0) {ufix$(0,-w_F-2)$};

  % ---- q0 to the exponent adder ----
  \draw[-latex] (4.6,4.25) -- (3.6,4.25); \node[anchor=south] at (4.1,4.30) {$q_0$};

  % ---- into the rounding adder ----
  \draw[-latex] (2.1,3.9) -- (2.1,3.2);
  \node[anchor=west] at (2.15,3.55) {$E_Q$}; \node[anchor=east] at (2.05,3.55) {$2+w_E$};
  \draw[-latex] (6.5,3.9) -- (6.5,3.2);
  \node[anchor=west] at (6.6,3.55) {$F_Q$}; \node[anchor=east] at (6.4,3.55) {ufix$(-1,-w_F-1)$};

  % ---- into the packer ----
  \draw[-latex] (2.1,2.5) -- (2.1,1.9); \node[anchor=west] at (2.15,2.20) {$2+w_E$};
  \draw[-latex] (6.5,2.5) -- (6.5,1.9); \node[anchor=west] at (6.55,2.20) {$w_F$};

  % ---- result ----
  \draw[-latex] (4.8,1.2) -- (4.8,0.5); \node[anchor=north] at (4.8,0.45) {$R$};
\end{circuitikz}
\end{document}
```

*After Fig. 11.8, p. 348.*

**Split the operation along the three fields and watch two of them become trivial.** For normal $X = (-1)^{s_X}2^{E_X-E_0}M_X$ and $Y = (-1)^{s_Y}2^{E_Y-E_0}M_Y$ in `Nfloat`$(w_E,w_F)$ — one sign bit, a $w_E$-bit biased exponent field, a $w_F$-bit fraction whose implicit leading one makes $M \in [1,2)$ a `ufix(0,`$-w_F$`)` number of $w_F+1$ bits ([[Floating-Point Formats]]) — multiplicativity of the representation gives

$$X/Y = (-1)^{s_X \oplus s_Y}\cdot 2^{E_X - E_Y}\cdot M_X/M_Y \tag{11.2}$$

The sign is one XOR gate. The exponent is one subtraction. Everything difficult is in $M_X/M_Y$, and that difficulty belongs to [[Dividers]], not here — this note is the wrapper. The reason the wrapper is worth studying separately is that the significand division it wraps is a *strictly easier* problem than general fixed-point division: $M_Y \ge 1$ means the reciprocal $1/M_Y \le 1$ is bounded, its derivative is bounded, and no prescaling or range analysis is needed to keep a digit recurrence in range. Several fixed-point dividers begin by converting their inputs to a floating-point-like normalized form precisely to buy this property (p. 347).

**The bias cancels itself in a difference, so it has to be put back by hand.** Writing $E_X = e_X + E_0$ and $E_Y = e_Y + E_0$ for the true exponents $e_X, e_Y$ and the bias $E_0 = 2^{w_E-1}-1$, the difference of the *stored fields* is $E_X - E_Y = e_X - e_Y$ — unbiased, by cancellation. The result field must be biased, so $E_0$ must be added back. This is the mirror image of the [[Floating-Point Multiplier]], where the exponents are summed, the bias appears twice, and one copy must be subtracted. The subtractor is a signed $(1+w_E)$-bit block: $e_X - e_Y$ ranges over $[-(2^{w_E}-1),\, 2^{w_E}-1]$, which needs exactly one bit beyond the field width.

**Monotonicity pins the quotient to exactly two binades, and the shift goes left.** From $M_X, M_Y \in [1,2)$ and monotonicity of division in each argument, $Q = M_X/M_Y \in (\tfrac12, 2)$ — open at both ends, since neither operand attains $2$. Two binades, statically known, so normalization is a *single* bit position and not a variable shift: no leading-zero counter, nothing from [[Shifters]]. The leading bit $q_0$ of $Q$ (the bit of weight $2^0$) decides. If $q_0 = 1$ then $Q \in [1,2)$ and $Q$ is already normalized. If $q_0 = 0$ then $Q \in (\tfrac12,1)$, the mantissa is multiplied by two — a 1-bit *left* shift — and $-1$ is charged to the exponent. Contrast the multiplier, where $P \in [1,4)$ and the correction is a right shift with $+1$; the direction flips because dividing moves the operand range down rather than up.

**Fold the $-1$ into the bias constant and it disappears into the wiring.** Naively the exponent path is $(E_X - E_Y) + E_0 - (1 - q_0)$, which reads as a second addition. Instead of adding $E_0$ and then conditionally subtracting one, add the single constant $E_0 - 1 + q_0$. The point is what that constant looks like in binary. $E_0 = 2^{w_E-1}-1$ is a string of $w_E-1$ ones, hence **odd**, hence its LSB is $1$; so $E_0 - 1$ differs from $E_0$ in that bit alone and has LSB $0$; and since $q_0 \in \{0,1\}$ now adds into a position that is empty, no carry can propagate out of it. Therefore

$$E_0 - 1 + q_0 \;=\; \underbrace{(E_0 \wedge \overline{1})}_{\text{LSB forced to }0} \vee\; q_0 \;=\; E_0 \text{ with its LSB replaced by } q_0$$

which is a wire substitution on the constant input of an adder that was going to be there anyway (p. 349). The second exponent operation costs nothing — not an adder, not even the multiplexer the multiplier needs for its two speculative exponents.

> [!note] Why this is a divider trick and not a multiplier trick
> It works because the correction is $-1$ and the bias is odd, so subtracting one *clears* a bit instead of borrowing across the field. The multiplier's correction is $+1$, which would carry, which is why it pays for a mux over two precomputed exponents instead. Same problem, opposite sign, completely different cost.

**Keep both exponent adders exact so the pack block can read overflow off the top.** The two adders down the left of the figure are not truncated to $w_E$ bits: the difference is $1+w_E$ bits and $E_Q$ is $2+w_E$ bits. Those two extra MSBs *are* the overflow/underflow detection mechanism — the [[Floating-Point Exception Handling|pack block]] interprets them to decide $\pm\infty$ versus subnormal versus normal, in a way that depends on the format. Truncate them and the exception logic has to be rebuilt out of comparators.

**Rounding is split across two blocks, and the guard bit migrates between them.** Inside the `/` block the remainder is used to return $Q$ as a *truncation* of the exact quotient to `ufix(0,`$-w_F-2$`)`, i.e. $w_F+3$ bits. That format carries one bit more than the result needs, and the reason is the normalization: the LSB at weight $2^{-w_F-2}$ is a guard bit that *becomes* the round bit at $2^{-w_F-1}$ exactly when $Q \in (\tfrac12,1)$ and the left shift happens. After normalization the fraction $F_Q$ is `ufix(-1,`$-w_F-1$`)`, $w_F+1$ bits, leading one dropped. The [[Floating-Point Rounding Adder]] then concatenates $F_Q$ below $E_Q$ and adds the bit of $F_Q$ at position $-w_F-1$; a carry out of the fraction propagates into the exponent field, which is correct because the concatenation *is* the binary encoding of the result, and incrementing past an all-ones fraction is exactly "next binade" ([[Rounding]]).

**Ties cannot occur, so round-to-nearest needs no tie rule at all.** That rounding adder implements round to nearest, ties away. But for binary floating-point division with identical input and output formats a quotient can never land exactly on a midpoint ([Mul+18], lemma 4.13, cited p. 349) — so the baseline is already correctly rounded to nearest under *every* tie convention, and the ties-to-even logic that costs the [[Floating-Point Adder]] a full sticky tree costs the divider nothing. **Directed rounding is where the one real addition to the design appears**: an exactly representable quotient such as $1.0/1.0$ must be returned unmodified in every mode, and exactness is equivalent to a *null remainder*. The logical OR of the remainder bits inside the divider, exported as a [[Sticky Bit Generator|sticky bit]], is the whole fix (p. 350).

**Predict the normalization instead of performing it.** $Q \in (\tfrac12,1) \iff M_X < M_Y$, a plain unsigned [[Comparators|comparison]] of two $(w_F{+}1)$-bit significands. So $q_0$ is known before the division starts, and the 1-bit normalization block can be deleted in favour of a 1-bit left shift of $M_X$ *before* the divider. That looks like a worse trade — the same shift, now upstream of everything — but it wins whenever the `/` component does preprocessing such as prescaling, because the shift hides inside work that was happening anyway and the divider's output then needs no post-processing at all (p. 349). `flopoco FPDiv we=8 wf=23` builds the baseline ([[FloPoCo]]).

**Subnormals cost more here than in the multiplier, for two structural reasons, both about the divisor.** First, unlike multiplication — where the product of two subnormals always rounds to zero, so only one subnormal input ever needs handling — the **both-subnormal case must be handled**, though for standard formats the quotient is then never itself subnormal. Second, a significand multiplier does not care whether the leading bit of an input is a one, but most divider algorithms *require* $M_Y$ normalized, because that is the hypothesis under which the digit recurrence stays in range. The simplest fix is to normalize both inputs into an internal format with a 1-bit wider exponent before the baseline — a leading-zero count plus one shifter per input ([[Subnormal Normalization Unit]]). Subnormal outputs ("tiny results") are predictable early from the exponent difference with a 1-bit uncertainty, and predicting them can *reduce* latency, because a subnormal result needs fewer quotient digits. In [Bru18], subnormal inputs add two cycles before the main computation and tiny results add one at the end (p. 350).

**A faithful divider needs no architectural change, because the error budget closes at exactly one ulp.** Suppose the `/` block is only faithful to its output format, $|\delta_Q| = |Q - M_X/M_Y| < 2^{-w_F-2}$ ([[Error Accuracy]]). Propagate that forward through the two remaining stages. The possible left normalization multiplies the significand by two, and absolute error scales with the value, so the bound doubles; the rounding adder then adds at most half an ulp of the final format:

$$\underbrace{2^{-w_F-2}\ \xrightarrow{\ \times 2\ }\ 2^{-w_F-1}}_{\text{possible left normalization}} \;+\; \underbrace{2^{-w_F-1}}_{\text{rounding adder}} \;=\; 2^{-w_F} \;=\; 1\ \text{ulp}$$

and in the branch where the rounding adder carries into the exponent, the significand is divided by two and so is the attached absolute error, so the bound survives there too. What matters is **the bound, not the format**: any output format `ufix(0,`$l_Q$`)` is acceptable as long as $|\delta_Q| < 2^{-w_F-2}$ holds, which is why a quotient built from a faithful reciprocal and a faithful multiplier on `ufix(0,`$-w_F-3$`)` still qualifies ([[Division by Reciprocal]], §9.3.1, p. 289). One range check is owed before believing any of this: does a faithful significand divider still land inside $[\tfrac12, 2)$, so that one bit of normalization still suffices? The two extremal quotients $\tfrac12$ and $2 - 2^{-w_F}$ are both exactly representable in `ufix(0,`$-w_F-2$`)`, so a faithful divider returns them exactly and cannot overshoot the interval (p. 351). Yes.

**Where the significand division is itself a multiplication, the last adder disappears too.** If $M_X/M_Y$ is computed by multiplying $M_X$ by an approximate inverse of $M_Y$, the `/` block *ends* in a multiplier — and then the rounding adder can be fused into that multiplier's compression tree by [[Injection Rounding]], absorbed as one extra column of the [[Compressor Trees|compressor tree]] (p. 351). The rounding adder stops being a separate slow block.

$$\boxed{\ E_Q = (E_X - E_Y) + \big(E_0 \text{ with LSB} \leftarrow q_0\big), \qquad F_Q = \begin{cases} Q \gg 1, & q_0 = 1\\ Q, & q_0 = 0\end{cases}\ }$$

**When it breaks.**

- The whole "two binades, one shift" argument assumes both operands **normal**. Subnormal inputs break $M \in [1,2)$, $Q$ can then leave $(\tfrac12,2)$ by many binades, and a 1-bit normalization is no longer sufficient — which is why the fix is to normalize *before* the baseline rather than to widen the shift after it.
- The bias fold needs $E_0$ **odd**, which holds for the IEEE-style bias $2^{w_E-1}-1$ at every $w_E \ge 2$. A non-standard format with an even bias loses the trick and pays for a real increment on the exponent path.
- "Ties are impossible" is a theorem about *identical input and output formats*. A divider producing a wider result than its inputs, or a divide fused with a round to a narrower format, can hit a midpoint, and then the tie rule matters again.
- Faithfulness of the final result requires $|\delta_Q| < 2^{-w_F-2}$ **strictly**. A divider faithful only to `ufix(0,`$-w_F-1$`)` misses the budget by a factor of two; recovering correct rounding from that one-bit-short quotient is a different circuit ([[Correct Rounding from Faithful Quotient]]) and it costs a truncated multiply, a comparison and a second rounding addition to buy back a single bit.
- Nothing here amortises with width. The exponent path is $O(w_E)$ and irrelevant; the latency is whatever the `/` block costs, $\Theta(w_F)$ for a digit recurrence and $\Theta(\log w_F)$ multiplications for Newton–Raphson or Goldschmidt. Optimising the wrapper past this point is optimising the wrong block.

> [!warning] Not covered in the source — needs outside research
> Chapter 11 gives no synthesis results for any divider: no LUT, slice or DSP counts, no delays, no area. The only hard quantities are the bit widths in Fig. 11.8 and Bruguera's "+2 cycles for subnormal inputs, +1 cycle for tiny results" (p. 350). In particular, the claim that the pre-divider $M_X$ shift is *cheaper* than the post-divider normalization is argued qualitatively (p. 349) and is not measured; whether it holds on an FPGA, where the mux would otherwise be free inside a LUT that is already routing $F_Q$, needs its own experiment.

**RTL (Spade).**

```spade
/// E_0 - 1 + q0 for a WE-bit biased exponent field. E_0 = 2^(WE-1) - 1 is odd,
/// so this is E_0 with its LSB replaced by q0: pure wiring, no adder.
fn bias_lsb<#uint WE>(q0: bool) -> uint<WE> {
    let zero: uint<{WE - 2}> = 0;
    let mid: uint<{WE - 2}> = ~zero;          // E_0 above its LSB: all ones
    let hi: uint<{WE - 1}> = zext(mid);       // ... under the 0 MSB of E_0
    hi.concat(q0.as_uint())                   // ... and q0 in the LSB
}

/// Everything in Fig. 11.8 except the `/` block: exponent path and 1-bit
/// normalization. q is the divider's Q in ufix(0,-WF-2), MSB = q0.
entity fpdiv_post<#uint WE, #uint WF>(
    ex: uint<WE>,
    ey: uint<WE>,
    q: uint<{WF + 3}>,
) -> (int<{WE + 2}>, uint<{WF + 1}>) {
    let q0 = q.msb();
    let ed: int<{WE + 1}> = trunc(ex.to_int() - ey.to_int());
    let eq: int<{WE + 2}> = ed + bias_lsb::<WE>(q0).to_int();
    let fq: uint<{WF + 1}> = if q0 { trunc(q >> 1) } else { trunc(q) };
    (eq, fq)
}
```

`ed` is the `$-$` box, held at $1+w_E$ signed bits by `to_int()` (value-preserving, $w_E{+}1$ bits) followed by `trunc` back to that width — the difference of two $w_E$-bit fields always fits, so the truncation discards a sign-extension bit and nothing else. `eq` is the $E_Q$ wire at $2+w_E$ bits, whose two MSBs the pack block reads. `bias_lsb` is the entire content of the `$+E_0-1+q_0$` box and synthesises to *no logic at all*: a constant with one bit driven by $q_0$. The `if q0` on `fq` is the 1-bit normalization, and both arms are bit selections out of the same $(w_F{+}3)$-bit word, so synthesis emits a $(w_F{+}1)$-bit 2:1 mux rather than a shifter — the one place where the drawing's separate block looks more substantial than the netlist. All of it is combinational; in a real pipeline these wires straddle the divider's last stage.

Verified by simulation at $w_E = 8$, $w_F = 23$ (binary32): **3008 vectors, zero failures**, against a behavioural reference computing $E_Q = E_X - E_Y + 126 + q_0$ and the two bit-slices of $F_Q$. Named vectors include $1.0/1.0$ ($E_X = E_Y = 127$, $Q = 1.0$ exactly), $Q$ one ulp below one, both extremal exponent differences, and the deliberately asymmetric $E_X = 1,\ E_Y = 128$ paired with a $Q$ whose top and bottom bits differ — a swapped subtraction or a bit-reversed fraction slice fails those and passes every symmetric vector; then 3000 random $(E_X, E_Y, Q)$ triples.

**Related Notes.**

- [[Dividers]] – depends-on: supplies the `/` block; everything in this note is the floating-point wrapper around it.
- [[SRT Division]] – depends-on: the usual `/` implementation, and the source of both the truncation to `ufix(0,`$-w_F-2$`)` and the remainder OR that becomes the sticky bit.
- [[Division by Reciprocal]] – extends: replaces the digit recurrence with a multiply, which is what makes the rounding adder fusible.
- [[Injection Rounding]] – extends: fuses that rounding adder into the reciprocal multiplier's compression tree.
- [[Floating-Point Rounding Adder]] – depends-on: the final stage, where the fraction carry propagates into the exponent field.
- [[Correct Rounding from Faithful Quotient]] – extends: what to do when the quotient is faithful only to $2^{-w_F-1}$ instead of $2^{-w_F-2}$.
- [[Floating-Point Multiplier]] – compares: same three-field split, but $+1$ instead of $-1$, so the exponent correction is a mux rather than a wire.
- [[Floating-Point Square Root]] – compares: the other operator whose singularity is removed by normalized inputs, and whose exponent path also exploits the parity of $E_0$.
- [[Floating-Point Exception Handling]] – depends-on: consumes the two extra exponent MSBs and Table 11.3's special cases.
- [[Subnormal Normalization Unit]] – supports: the pre-baseline normalization that restores $M_Y \in [1,2)$.
- [[Sticky Bit Generator]] – supports: the null-remainder flag that makes directed rounding modes exact.
- [[Comparators]] – supports: $M_X < M_Y$ predicts $q_0$ early and lets the normalization move upstream.
- [[Error Accuracy]] – supports: the $\times 2$ then $+\tfrac12$ ulp budget that turns a faithful divider into a faithful operator.
- [[Choosing a Floating-Point Operator]] – compares: where the "a truncated multiply and a second rounding addition, for one bit" trade sits against the other operators.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11, "Basic Floating-Point Operators".

- §11.3 and §11.3.1, (11.2), Table 11.3 and Fig. 11.8, pp. 347–349 — the normalized-divisor argument, the exponent difference and bias restoration, the $E_0-1+q_0$ LSB substitution, the exact $2+w_E$ exponent adders, the two-stage rounding with the migrating guard bit, the impossibility of ties, and the $M_X < M_Y$ normalization prediction.
- §11.3.2, p. 350 — directed rounding via the null-remainder sticky bit; subnormal handling, the both-subnormal case, and Bruguera's +2/+1 cycle figures.
- §11.3.3, p. 351 — the faithful divider error budget $|\delta_Q| < 2^{-w_F-2}$, its independence from the output format, the extremal-quotient range check, and injection rounding into a reciprocal multiplier.
- §11.2.1–11.2.4, pp. 343–347 — the multiplier, for the contrast on exponent correction and on which operand ranges are statically known.
