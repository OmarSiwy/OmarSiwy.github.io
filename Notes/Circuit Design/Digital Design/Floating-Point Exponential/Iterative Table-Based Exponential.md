---
title: "Iterative Table-Based Exponential"
description: "A digit-recurrence family: two small tables per step drive L_i toward zero, cancelling alpha_i-1 leading bits so the datapath narrows monotonically, then rectangular multipliers reconstruct — cumulated multiplier area is about one full multiplier, and it suits LUT-only fabrics and ASIC, not DSP/BRAM FPGAs."
kind: circuit
source: "ASA §22.5.5, pp. 662-663"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, digit-recurrence, exponential, tables, fpga]
aliases:
  - Iterative Exponential
  - Small-Table Exponential
  - Rectangular-Multiplier Exponential
---

# Iterative Table-Based Exponential

A digit recurrence for $e^Y$ that never evaluates the exponential directly: it subtracts tabulated logarithms until the argument reaches zero, then multiplies the matching tabulated exponentials back up — the one architecture in this chapter whose datapath *narrows* as it runs.

```tikz title="Iterative e^Y: one reduction step and one reconstruction step"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ================= reduction, increasing i =================
  \node[anchor=west,font=\small\itshape] at (-6.4,10.8) {reduction, increasing $i$ --- drives $L_i\to0$};

  % L_i word
  \draw (-3.6,9.2) rectangle (2.4,9.7);
  \draw (-2.1,9.2) -- (-2.1,9.7);
  \node at (-2.85,9.45) {$A_i$};
  \node at (0.15,9.45) {remaining bits of $L_i$};
  \node[anchor=east] at (-3.65,9.45) {$L_i$};
  \draw[<->] (-3.6,9.95) -- (-2.1,9.95);
  \node[anchor=south] at (-2.85,9.92) {$\alpha_i$ bits};
  \node[anchor=south east] at (2.45,9.75) {LSB $\ell$};
  \node[anchor=west] at (2.5,9.45) {$w_i$ bits};

  % A_i fan-out to the two tables
  \draw (-2.85,9.2) -- (-2.85,8.8);
  \draw (-4.5,8.8) -- (-1.5,8.8);
  \draw[->] (-4.5,8.8) -- (-4.5,8.4);
  \draw[->] (-1.5,8.8) -- (-1.5,8.4);

  % tables
  \draw (-5.7,7.6) rectangle (-3.3,8.4);
  \node[align=center] at (-4.5,8.0) {$X_i^\dagger = E_i^\dagger-1$\\[-1pt]\footnotesize $2^{\alpha_i}$ entries};
  \draw (-2.7,7.6) rectangle (-0.3,8.4);
  \node[align=center] at (-1.5,8.0) {$L_i^\dagger=\ln E_i^\dagger$\\[-1pt]\footnotesize $2^{\alpha_i}$ entries};

  % L_dagger into subtractor
  \draw[->] (-1.5,7.6) -- (-1.5,6.9);
  \node[anchor=east] at (-1.55,7.25) {$L_i^\dagger$};
  \node[anchor=west] at (-1.45,7.25) {\texttt{sfix}, LSB $\ell$};

  % L_i bypass
  \draw[->] (2.2,9.2) -- (2.2,6.9);
  \node[anchor=west] at (2.25,8.0) {$L_i$};

  % subtractor
  \draw (-2.3,6.2) rectangle (2.9,6.9);
  \node at (0.3,6.55) {$-$ \ \ (22.33)};
  \draw[->] (0.3,6.2) -- (0.3,5.3);
  \node[anchor=west] at (0.35,5.95) {$L_{i+1}$\quad $w_i-(\alpha_i-1)$ bits, LSB $\ell$};
  \node[anchor=west,font=\footnotesize] at (0.35,5.55) {top $\alpha_i-1$ bits cancel $\Rightarrow$ narrower each step};

  % X_dagger kept for reconstruction
  \draw[->] (-4.5,7.6) -- (-4.5,5.7);
  \node[anchor=east] at (-4.55,6.6) {$X_i^\dagger$};
  \node[anchor=west] at (-4.45,6.6) {$\alpha_i$ bits};
  \node[anchor=north,font=\footnotesize] at (-4.5,5.65) {kept for reconstruction};

  % separator
  \draw[dashed,gray] (-6.4,5.0) -- (3.6,5.0);

  % ================= reconstruction, decreasing i =================
  \node[anchor=west,font=\small\itshape] at (-6.4,4.7) {reconstruction, decreasing $i$ --- eq.\ (22.34)};

  % inputs
  \draw[->] (-3.2,4.3) -- (-3.2,3.3);
  \node[anchor=east] at (-3.25,3.75) {$X_{i+1}$};
  \node[anchor=west] at (-3.15,3.75) {$w_{i+1}$ bits};
  \draw[->] (0.8,4.3) -- (0.8,3.3);
  \node[anchor=east] at (0.75,3.75) {$X_i^\dagger$};
  \node[anchor=west] at (0.85,3.75) {$\alpha_i$ bits};

  % bypasses
  \draw (-3.2,4.15) -- (-4.9,4.15) -- (-4.9,2.4);
  \draw[->] (-4.9,2.4) -- (-3.2,2.4) -- (-3.2,2.1);
  \draw (0.8,4.15) -- (2.9,4.15) -- (2.9,2.4);
  \draw[->] (2.9,2.4) -- (1.4,2.4) -- (1.4,2.1);

  % rectangular multiplier
  \draw (-3.8,2.5) rectangle (1.4,3.3);
  \node at (-2.6,2.9) {$\times$};
  \node[anchor=west,font=\footnotesize] at (-2.4,2.9) {rectangular: $w_{i+1}\times\alpha_i$};
  \draw[->] (-1.2,2.5) -- (-1.2,2.1);
  \node[anchor=west,font=\footnotesize] at (-1.15,2.3) {$w_{i+1}+\alpha_i$ bits};

  % adder
  \draw (-3.8,1.3) rectangle (2.4,2.1);
  \node at (-0.7,1.7) {$+$};
  \draw[->] (-0.7,1.3) -- (-0.7,0.7);
  \node[anchor=west] at (-0.65,1.0) {$X_i=X_{i+1}X_i^\dagger+X_{i+1}+X_i^\dagger$};

  \node[anchor=north,font=\small] at (-0.7,0.6) {at $i=0$: \ $e^{Y}=e^{L_0}\approx X_0+1$\quad(the leading $1$ is never stored)};
\end{circuitikz}
\end{document}
```

*The word split at the top is Fig. 22.8, p. 663; the surrounding dataflow is my own construction from (22.32)–(22.34), pp. 662–663.*

**Build the recurrence out of matched pairs, not out of the function.** Precompute pairs of reals $(E_i^\dagger, L_i^\dagger)$ constrained only by $E_i^\dagger = e^{L_i^\dagger}$. From seeds $L_0$ and $E_0 = e^{L_0}$, define two sequences by

$$\forall i>0\quad\begin{cases} L_{i+1} = L_i + L_i^\dagger\\ E_{i+1} = E_i\times E_i^\dagger\end{cases} \qquad (22.32)$$

The invariant $E_i = e^{L_i}$ is preserved by the addition theorem $e^{a}e^{b}=e^{a+b}$: $E_{i+1}=E_i^\dagger E_i = e^{L_i^\dagger}e^{L_i}=e^{L_i^\dagger+L_i}=e^{L_{i+1}}$. Each step costs one addition and one multiplication, and since the multiplication is the expensive half, the pairs are chosen so that $E_i^\dagger$ fits on few bits.

> [!note] The same hardware computes the logarithm by running the recurrence in the other direction — drive $E_i\to1$ by selecting an $E_i^\dagger$ close to $1/E_i$ at each step, stop at $E_n\approx1$, initialise $L_n\approx0$ and roll (22.32) back until $L_0\approx\ln E_0$. Exponential and logarithm are the same digit recurrence, steered at different variables.

**Steer $L_i$ to zero and let the tables supply the digits.** For the exponential of a reduced argument $Y\in[-\tfrac12,\tfrac12]$ — see [[Reduced Argument Subtractor]] for where that range comes from — seed $L_0 = Y$ on $w_0$ bits of signed fixed point with LSB weight $2^{\ell}$, and iterate until $L_n$ is small enough that $e^{L_n}-1$ falls to a small table or a Taylor term. The digit at step $i$ is the subword $A_i$ of the $\alpha_i$ **leading** bits of $L_i$, which addresses two tables of $2^{\alpha_i}$ entries each:

- $X_i^\dagger = E_i^\dagger - 1$, an approximation to $e^{L_i}-1$ built from $A_i$ alone and rounded to a fixed-point format of only $\alpha_i$ bits;
- $L_i^\dagger = \ln(E_i^\dagger)$, rounded to LSB $\ell$ — the same LSB every $L_i$ carries.

Both are ordinary ROM or LUT lookups ([[Lookup-Tables]]); $\ell$ itself is a free parameter fixed by the error budget ([[Error Accuracy]]).

**Read the cancellation as a width statement, not an accuracy statement.** Because $L_i^\dagger\approx L_i$ by construction,

$$L_{i+1} = L_i - L_i^\dagger \qquad (22.33)$$

cancels the $\alpha_i-1$ most significant bits of $L_i$. This is the digit-recurrence skeleton shared with [[SRT Division]]: a selection function reads the top few bits of a residual and the subtraction annihilates them. Here $L_i$ and $L_i^\dagger$ share the LSB $\ell$, so the subtraction is width-aligned and no alignment shifter appears anywhere; the residual handed to the next step is

$$w_{i+1} = w_i - (\alpha_i - 1)$$

bits wide. The datapath narrows *monotonically*, which no other $e^Y$ architecture in this chapter does, and it pins the iteration count at $n\approx w_F/(\alpha-1)$ for a constant $\alpha_i=\alpha$ and a target significand of $w_F$ bits.

**Change variable so the leading one is never stored.** Reconstruction runs (22.32) with decreasing $i$, but storing $E_i$ directly wastes a bit position: $E_i\to1$, so the leading one is known and carries no information. Store $X^\dagger = E^\dagger - 1$ and compute $X_i = E_i - 1$ instead. Expanding $E_i = E_{i+1}E_i^\dagger$ as $(1+X_i)=(1+X_{i+1})(1+X_i^\dagger)$, distributing the product over the sum, and cancelling the $1$ on both sides:

$$X_i = X_{i+1}\times X_i^\dagger + X_{i+1} + X_i^\dagger \qquad (22.34)$$

with $e^{Y} = e^{L_0}\approx X_0+1$ at the end — that final $+1$ being a wire into the significand's implicit leading bit rather than an adder ([[Number Formats]]).

**The rectangular multipliers are the whole economy.** $X_i^\dagger$ stays $\alpha_i$ bits wide at every step while $X_{i+1}$ is $w_{i+1}$ bits, so each product in (22.34) needs a $w_{i+1}\times\alpha_i$ **rectangular** multiplier ([[Multipliers]]), never a square one. Because the $w_{i+1}$ shrink by $\alpha_i-1$ per step in exactly the way the residual does, the *cumulated* size of all $n$ rectangular multipliers is only slightly larger than that of one single full significand multiplier. The operator spends the silicon a one-shot architecture spends on its single multiply, but spread across the iterations — which is why the comparison against a polynomial architecture is a genuine contest and not a foregone conclusion.

**Where the mapping wins, and where it inverts.** On LUT-only FPGAs this is an excellent match: set $\alpha_i$ to the LUT input width and each table costs one LUT level, with $\alpha_i$ acting as a clean knob — a larger $\alpha_i$ buys fewer iterations at the price of larger tables. On modern DSP-and-block-memory FPGAs ([[FPGAs]]) the fit fails in both directions at once: size $\alpha_i$ to optimise memories or LUTs and the rectangular multipliers underuse the DSP blocks; size $\alpha_i$ to fill the DSPs and the $2^{\alpha_i}$ tables explode. There, prefer [[Higher-Order e^Y Evaluator]] or [[Polynomial h(Z) Evaluator]]. On ASIC the binding constraint is different again: the additions on the $L_i$ datapath (22.33) are in the critical path, so implementations move to high-radix [[Redundant Number Systems]] to break the carry chains [Erc73; PEB03; PEB04].

$$\boxed{\ L_{i+1} = L_i - L_i^\dagger,\qquad X_i = X_{i+1}X_i^\dagger + X_{i+1} + X_i^\dagger,\qquad w_{i+1}=w_i-(\alpha_i-1),\qquad n\approx\tfrac{w_F}{\alpha-1}\ }$$

**When it breaks.**

- **Latency is two sequential passes.** Reconstruction cannot start until reduction terminates, so the operator costs $2n$ dependent steps against one table-plus-multiply-plus-add for [[Higher-Order e^Y Evaluator]]. Anything latency-bound should not use it.
- **Every $X_i^\dagger$ has to survive from the first pass to the second.** That is $\sum_i \alpha_i \approx w_F$ bits of storage plus its addressing — free wiring if you unroll, a small LIFO plus a pointer if you fold.
- **Folding it makes the loop control visible.** A folded implementation needs an iteration counter, per-$i$ table addressing (the table contents differ per step, so they merge into one wider ROM addressed by $i \Vert A_i$), and a datapath sized for $w_0$ throughout with the narrowing expressed as leading zeros rather than as removed hardware. A varying $\alpha_i$ additionally makes the subword extraction a mux instead of a wire; a constant $\alpha$ avoids that but wastes the late iterations, where the residual is already short.
- **DSP-and-BRAM fabrics invert the argument entirely**, as above. What the fabric hardens, not the bit counts, decides the table/multiplier trade.
- **Termination is a separate design problem.** $e^{L_n}-1$ still has to be evaluated for whatever residual is left; see [[Tabulated e^Y]].

> [!warning] Not covered in the source — needs outside research
> The book states plainly (p. 663) that *"a detailed comparison on the same technology of this iterative architecture and a polynomial-based one is currently missing."* There are therefore **no LUT, slice, DSP-count or delay figures in Chapter 22** for this family, and no worked parameter choice of the kind §22.5.4 gives for the higher-order architecture. Every quantity on this page is structural. Do not invent synthesis numbers.

**RTL (Spade).** One iteration of each direction. Nothing is unrolled — the $n$-iteration operator is these two entities repeated, or one of each time-multiplexed.

```spade
// one reduction step: L_{i+1} = L_i - L_i^dagger   (22.33)
// L_i and L_i^dagger share the LSB weight 2^l, so the subtraction is
// width-aligned and the top A-1 bits of the difference are sign extension.
entity exp_reduce_step<#uint W, #uint A>(l: int<W>, ldag: int<W>) -> int<{W - A + 1}> {
    trunc(l - ldag)
}

// one reconstruction step: X_i = X_{i+1} X_i^dagger + X_{i+1} + X_i^dagger  (22.34)
// xn and the result carry LSB weight 2^-W; xdag is the A-bit table word, placed
// at its (compile-time constant) position by concatenation, not by a shifter.
entity exp_recon_step<#uint W, #uint A>(xn: uint<W>, xdag: uint<A>) -> uint<W> {
    let zero: uint<{W - A}> = 0;
    let d: uint<W> = xdag.concat(zero);
    let p: uint<{W + W}> = xn * d;
    let (_, hi) = p.as_bits().split_at::<W>();   // realign 2^-2W back to 2^-W
    let ph: uint<W> = hi.as_uint();
    let s: uint<W> = trunc(ph + xn);
    trunc(s + d)
}
```

`l` and `ldag` are the $L_i$ bypass and the $L_i^\dagger$ table output in the upper half of the diagram; `xn` and `xdag` are $X_{i+1}$ and $X_i^\dagger$ in the lower half. The `trunc` in `exp_reduce_step` *is* the narrowing: `int<W>` minus `int<W>` grows to `int<{W+1}>`, and dropping to `int<{W-A+1}>` is lossless only because the top $\alpha_i-1$ bits cancelled — the one claim the testbench checks, by generating vectors that honour $|L_i - L_i^\dagger| < 2^{\,w_i-\alpha_i}$ ulps. Both entities are combinational; a real operator registers between iterations and reuses a single instance of each.

Two things synthesis does differently from the drawing. Spade's `*` demands equal operand widths, so `xdag` is placed into a `uint<W>` word by `concat` and the multiplier reads as $W\times W$ in the source — its upper $W-A$ input bits are constant zero and are pruned, leaving exactly the $w_{i+1}\times\alpha_i$ rectangular array the diagram shows. And `split_at::<W>` discarding the low half is the realignment of the product back to LSB $2^{-W}$: free in wiring, but a truncation, biasing the result downward by up to one ulp, which the error budget has to absorb ([[Error Accuracy]]).

Compiled with `spade 0.19.0` and simulated against a behavioural reference: 4005 vectors on `exp_reduce_step<16,4>` (asymmetric named cases $1-128$, $128-1$, $-1-4094$, $\text{0x8000}-\text{0x8000}$, plus a 4000-vector random sweep over the valid cancellation range) and 4006 on `exp_recon_step<16,4>`, all passing.

**Related Notes**

- [[Choosing an Exponential Architecture]] – compares: where this family sits against every other way of evaluating $e^Y$.
- [[Higher-Order e^Y Evaluator]] – counter-example: one table and one square multiplier in a single pass, and the architecture to prefer on DSP/BRAM fabrics.
- [[Polynomial h(Z) Evaluator]] – counter-example: the large-precision alternative the source explicitly declines to compare this one against.
- [[Tabulated e^Y]] – depends-on: supplies $e^{L_n}-1$ once the residual is short enough to stop iterating.
- [[SRT Division]] – compares: same digit-recurrence skeleton — top bits of a residual select a table entry whose subtraction cancels them.
- [[CORDIC]] – compares: the classic CORDIC exponential is (22.32) with convergence achieved one bit at a time instead of $\alpha_i-1$ bits at a time.
- [[Multipliers]] – supports: the rectangular products whose cumulated area is this operator's headline cost.
- [[Lookup-Tables]] – supports: the $2^{\alpha_i}$-entry table pairs, and the reason $\alpha_i$ wants to equal the LUT input width.
- [[Redundant Number Systems]] – extends: high-radix redundant arithmetic breaks the carry chains that make (22.33) the ASIC critical path.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §22.5.5 *Iterative Computation of $e^Y$ Using Small Tables and Rectangular Multipliers* — pp. 662–663; eqs. (22.32)–(22.34); Fig. 22.8 *Decomposition of $L_i$*, p. 663.
  - §22.5.6 *To Read Further* — p. 663, on CORDIC as the one-bit-at-a-time variant of (22.32).
- Long-form source notes: `5.3a) Fixed-Point Computation of eY` and `5.3) Floating-Point Exponential`.
