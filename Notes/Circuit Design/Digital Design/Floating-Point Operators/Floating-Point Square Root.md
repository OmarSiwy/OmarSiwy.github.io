---
title: "Floating-Point Square Root"
description: "The easiest FP operator: never overflows, never underflows, and needs no rounding or normalization logic outside the sqrt block. Exponent halving is one addition because floor(E0/2) is a constant string of ones and the parity bit is the carry-in."
kind: circuit
source: "ASA §11.4.1, §11.4.3, pp. 353-356"
status: seed
spade: simulated
tags: [digital, floating-point, square-root, exponent, fpga]
aliases:
  - FP Square Root
  - FPSqrt
  - Baseline Square Root Architecture
  - Floating-Point Square Root Unit
---

# Floating-Point Square Root

A unary floating-point operator whose entire wrapper around the significand square-root core is a single $w_E$-bit addition and a one-bit shift multiplexer, because the result exponent can neither overflow nor underflow and the result significand is normalized by construction.

```tikz title="Baseline floating-point square root architecture"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- blocks -------------------------------------------------------------
  \node[draw, minimum width=8.4cm, minimum height=0.8cm] (unpack) at (0,6.0)
        {unpack \& exception handling};
  \node[draw, minimum width=8.4cm, minimum height=0.8cm] (pre)    at (0,4.2)
        {1-bit pre-normalization};
  \node[draw, minimum width=2.6cm, minimum height=1.4cm] (sq)     at (1.6,2.2)
        {$\sqrt{M_X^{\mathrm{norm}}}$};
  \node[draw, minimum width=8.4cm, minimum height=0.8cm] (pack)   at (0,0.3)
        {exception handling \& pack};

  % --- input / output -----------------------------------------------------
  \draw[->] (0,7.1) -- (0,6.4);
  \node[anchor=south] at (0,7.1) {$X$};
  \draw[->] (0,-0.1) -- (0,-0.9);
  \node[anchor=north] at (0,-0.9) {$R$};

  % --- unpack -> pre-normalization ---------------------------------------
  \draw[->] (-1.4,5.6) -- (-1.4,4.6);
  \node[anchor=east] at (-1.45,5.1) {$E_X$};
  \node[anchor=west] at (-1.35,5.1) {\tiny $w_E$};
  \draw[->] (1.6,5.6) -- (1.6,4.6);
  \node[anchor=west] at (1.7,5.1) {$M_X \in [1,2)$};
  \node[anchor=east] at (1.5,5.1) {\tiny \texttt{ufix(0,$-w_F$)}};

  % --- pre-normalization -> sqrt / pack ----------------------------------
  \draw[->] (1.6,3.8) -- (1.6,2.9);
  \node[anchor=west] at (1.7,3.35) {$M_X^{\mathrm{norm}} \in [1,4)$};
  \node[anchor=east] at (1.5,3.35) {\tiny \texttt{ufix(1,$-w_F$)}};

  \draw[->] (-2.6,3.8) -- (-2.6,0.7);
  \node[anchor=east] at (-2.7,2.3) {$E_S$};
  \node[anchor=west] at (-2.5,3.35) {\tiny $w_E$};

  \draw[->] (1.6,1.5) -- (1.6,0.7);
  \node[anchor=west] at (1.7,1.1) {$M_S \in [1,2)$};
  \node[anchor=east] at (1.5,1.1) {\tiny \texttt{ufix(0,$-w_F$)}};

  % --- sign bit, left rail -----------------------------------------------
  \draw[->] (-4.2,6.0) -- (-5.4,6.0);
  \node[anchor=south] at (-4.8,6.15) {$s_X$};
  \draw (-5.2,6.0) -- (-5.2,0.3);
  \draw[->] (-5.2,0.3) -- (-4.2,0.3);

  % --- exception rail, right ---------------------------------------------
  \draw (4.2,6.0) -- (5.4,6.0) -- (5.4,0.3);
  \draw[->] (5.4,0.3) -- (4.2,0.3);
  \node[anchor=east] at (5.4,6.55) {exceptions};
\end{circuitikz}
\end{document}
```

*after Fig. 11.10, p. 354.*

**Locate the one hard part.** For a positive normal $X = 2^{E_X - E_0} \cdot M_X$ in the format of [[Number Formats]] — $s_X$ one bit, exponent field $E_X$ of $w_E$ bits with bias $E_0 = 2^{w_E-1}-1$, fraction $F_X$ of $w_F$ bits, significand $M_X = 1.F_X \in [1,2)$ carried as `ufix(0,`$-w_F$`)` — every difficulty of the other four operators evaporates. There is no second operand to align, so no shifter and no leading-zero count; the result magnitude is bounded by the input magnitude, so no overflow and no underflow. What remains is that $\sqrt{2^{k}} = 2^{k/2}$ is only a floating-point number when $k$ is even, so the operator must split on the parity of the unbiased exponent $E_X - E_0$:

$$\sqrt{X}=\begin{cases}2^{(E_X-E_0)/2}\times\sqrt{1.F_X} & E_X-E_0 \text{ even}\\[3pt] 2^{(E_X-E_0-1)/2}\times\sqrt{2\times1.F_X} & E_X-E_0 \text{ odd}\end{cases}$$

**Turn the parity test into a wire.** $E_0 = 2^{w_E-1}-1$ is a string of $w_E-1$ ones, hence **odd**. Odd minus odd is even, so $E_X - E_0$ is even exactly when the *field* $E_X$ is odd — that is, exactly when $e = \mathrm{LSB}(E_X) = 1$. The parity decision therefore costs no comparator, no subtractor and no gate: it is bit $0$ of the exponent field, straight out of the unpacker. Everything downstream is controlled by that single bit $e$.

**Pay for the odd case with one multiplexer.** In the odd branch the significand is pre-multiplied by $2$, and multiplying a binary significand by two is a fixed one-bit left shift, so the "1-bit pre-normalization" block of the figure is a $(w_F+2)$-wide multiplexer on $e$ between $M_X$ zero-extended and $M_X$ shifted. Its output $M_X^\mathrm{norm}$ lives in `ufix(1,`$-w_F$`)` — $w_F+2$ bits — and ranges over $[1,4)$.

**Fold the halving into a single addition.** Write $E_X = 2\lfloor E_X/2\rfloor + e$ by the division algorithm and substitute into the biased result exponent. For $e = 1$ the unbiased exponent $E_X - E_0$ is even and

$$
E_S=E_0+\tfrac{E_X-E_0}{2}=E_0+\Big\lfloor\tfrac{E_X}{2}\Big\rfloor-\Big\lfloor\tfrac{E_0}{2}\Big\rfloor
=\Big\lfloor\tfrac{E_X}{2}\Big\rfloor+\Big\lfloor\tfrac{E_0}{2}\Big\rfloor+1,
$$

where the last step uses $E_0-\lfloor E_0/2\rfloor=\lfloor E_0/2\rfloor+1$, valid because $E_0$ is odd. The $e=0$ branch halves $E_X - E_0 - 1$ instead and drops the $+1$ identically, so both branches collapse into one expression in which $e$ appears as an ordinary term. Now read off what each term costs in hardware: $\lfloor E_X/2\rfloor$ is not a divider but a **relabelling of wires** — the upper $w_E-1$ bits of the field; $\lfloor E_0/2\rfloor = 2^{w_E-2}-1$ is a **compile-time constant**, a string of $w_E-2$ ones; and $e$, being a single bit added at weight $2^0$, is a **carry-in**. One $w_E$-bit addition of a variable and a constant with a carry-in, and the exponent path is finished.

**Check that the result exponent always fits.** With $E_X$ ranging over the normal fields $[1, 2^{w_E}-2]$, the sum is bounded above by $(2^{w_E-1}-1) + (2^{w_E-2}-1) + 1 = 3\cdot2^{w_E-2}-1 < 2^{w_E}$ and below by $2^{w_E-2}$. So $E_S$ needs no wider intermediate than $w_E$ bits and can neither carry out nor go subnormal — the operator has no overflow or underflow path at all, unlike [[Floating-Point Multiplier]] and [[Floating-Point Divider]], which both need one.

> [!note] The rounding and normalization logic is not simplified — it is absent
> $M_X^\mathrm{norm} \in [1,4)$ implies $M_S = \sqrt{M_X^\mathrm{norm}} \in [1,2)$, which is already the target format `ufix(0,`$-w_F$`)`. The square root is monotone and contracts the interval, so a correctly rounded $M_S$ is *necessarily* already normalized: there is no post-shift, hence no second rounding after a post-shift. Every rounding decision in the operator happens inside the $\sqrt{\ }$ block ([[Digit Recurrence for Algebraic Functions]]), and the wrapper is a pure permutation of bits plus one adder.

**Round to nearest without a tie-breaking rule.** Ties are the usual reason a correctly rounded operator needs a sticky bit and a tie-to-even path; here they cannot occur. Let $S = M + 2^{-w_F-1}$ be an exact midpoint between two consecutive significands, with $M$ in `ufix(0,`$-w_F$`)`. Expanding the square by the binomial identity,

$$S^2=M^2+2^{-w_F}M+2^{-2w_F-2}.$$

$M^2$ is a `ufix(1,`$-2w_F$`)` number whose leading one sits at position $0$ or $1$; $2^{-w_F}M$ is `ufix(`$-w_F,-2w_F$`)`; and the third term contributes a set bit at position $-2w_F-2$ that nothing else can cancel, since the other two terms have no bits below $-2w_F$. So $S^2$ carries a set bit at position $0$ or $1$ **and** a set bit at $-2w_F-2$: it spans more than $w_F+1$ significant bits and is therefore not representable in the input format. No input squares to a midpoint, so this architecture rounds to nearest regardless of which tie rule the specification names ([[Rounding]], p. 356).

**Subnormals are two different non-problems.** Outputs can never be subnormal — the square root of the smallest positive input is roughly the square root of the smallest exponent, which is nowhere near zero — and that also disposes of ties for subnormal inputs. Subnormal *inputs* need only be converted to normals of an internal format with the same fraction size $w_F$ and a **one-bit wider exponent**, and since that exponent is about to be halved anyway, the whole architecture above is reused **unchanged**: the added cost is a leading-zero counter and one shifter ([[Subnormal Normalization Unit]]), not a second datapath.

$$\boxed{\ E_S=\Big\lfloor\tfrac{E_X}{2}\Big\rfloor+\Big\lfloor\tfrac{E_0}{2}\Big\rfloor+e,\qquad e=\mathrm{LSB}(E_X),\qquad M_X^\mathrm{norm}=2^{1-e}M_X\in[1,4)\ }$$

**When it breaks.**

- **Faithful rounding voids the "already normalized" guarantee.** At the single input $M_X^\mathrm{max} = 4-2^{1-w_F}$, a faithful $\sqrt{\ }$ block is entitled to return exactly $2.0$, which `ufix(0,`$-w_F$`)` cannot hold; the architecture above silently drops the bit of weight $2^1$ and returns $1.0$. One point in a $2^{w_F}$-sized space, invisible to random testing — see [[Faithful Square Root Normalization Unit]].
- **Rounding up needs that same fix.** Rounding down and rounding to zero change only the interior of the $\sqrt{\ }$ block and the exception logic, but rounding up can reach $2.0$ for the same reason, so it needs the widened $M_S$ and the $E_S$/$E_S{+}1$ multiplexer.
- **The sign bit alone is not enough to emit NaN.** IEEE 754 fixes $\sqrt{-0} = -0$, because signed zeroes are still zeroes, while $\sqrt{X} = \mathrm{NaN}$ for every $X < 0$ and for $-\infty$. The unpacker must therefore test *sign and zero together*, not sign alone (Table 11.4, p. 353) — the whole of it belongs to [[Floating-Point Exception Handling]].
- **The wrapper is not where the cost is.** One adder and one multiplexer are noise next to the $\sqrt{\ }$ block itself, so choosing a square root operator is entirely a question of choosing that block's algorithm; nothing above changes with it.

```spade
entity fp_sqrt_pre<#uint WE, #uint WF>(
    ex: uint<WE>,            // biased exponent field E_X
    mx: uint<{WF + 1}>,      // 1.F_X, scaled by 2^WF, in [2^WF, 2^{WF+1})
) -> uint<{WE + WF + 2}> {   // E_S (high) concatenated with M_X^norm (low)
    let e = ex.lsb();                                       // parity selector
    let eh: uint<{WE - 1}> = ex.as_bits()[1..WE].as_uint();  // floor(E_X/2)
    let half_e0: uint<{WE - 1}> = zext(~(0 as uint<{WE - 2}>)); // floor(E_0/2)
    let es: uint<WE> = (eh + half_e0) +. zext::<1, WE>(e.as_uint());
    let mn: uint<{WF + 2}> = if e { zext(mx) } else { zext(mx) << 1 };
    es.concat(mn)
}
```

`ex.as_bits()[1..WE]` is the wire relabelling that implements $\lfloor E_X/2\rfloor$ — no logic, just the upper $w_E-1$ bits — and `half_e0` is the constant string of $w_E-2$ ones, so the synthesized `es` is one constant-operand adder whose carry-in is `e`. The `+.` is deliberate: $(w_E-1)+(w_E-1)$ bits widen to $w_E$, and the range bound above proves the further $+e$ cannot carry out, so truncating back to $w_E$ is exact rather than wrapping. `mn` is the one-bit pre-normalization multiplexer, and the whole entity is purely combinational — the $\sqrt{\ }$ block that consumes `mn` is the only part that will be pipelined. Synthesis will not build the two paths as drawn either: it merges the constant into the adder's LUT initialisation, so the exponent path costs $w_E$ LUTs and one carry chain on an FPGA, and roughly nothing on an ASIC next to the square root core.

**Related Notes**

- [[Digit Recurrence for Algebraic Functions]] – depends-on: the $\sqrt{\ }$ block this architecture wraps, where all of the area and all of the latency actually go.
- [[Faithful Square Root Normalization Unit]] – extends: repairs the single $M_X^\mathrm{max}$ input at which a faithful $\sqrt{\ }$ breaks the normalization guarantee assumed here.
- [[Floating-Point Exception Handling]] – supports: the unpack and pack blocks, including the sign-and-zero test that $\sqrt{-0}=-0$ forces.
- [[Floating-Point Divider]] – compares: the sibling that does need overflow, underflow and post-normalization logic, for the operand this one does not have.
- [[Subnormal Normalization Unit]] – extends: the LZC-plus-shifter front end that lets subnormal inputs reuse this architecture unchanged.
- [[Choosing a Floating-Point Operator]] – compares: where square root sits against the other four operators on cost and on last-ulp price.
- [[Error Accuracy]] – supports: the faithful-versus-correct-rounding error budget that decides whether the $M_X^\mathrm{max}$ fix is needed at all.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — §11.4 Floating-Point Square Root: §11.4.1 baseline architecture, Table 11.4, eqs. (11.4)–(11.6), Fig. 11.10, pp. 353–355; §11.4.3 IEEE 754 compliance, tie impossibility and subnormals, p. 356.
- `2.7) Floating-Point Operators.md` — the long-form treatment of all five operators this note was cut from.
