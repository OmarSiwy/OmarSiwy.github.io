---
title: eY Iterative Reconstruction Step
description: "One step of X_i = X_{i+1} * X_i^dagger + X_{i+1} + X_i^dagger run with decreasing i: a rectangular w x alpha_i multiplier plus an adder, with the leading one never stored, and all n multipliers cumulating to barely more than one full multiplier."
kind: circuit
source: "ASA §22.5.5, pp. 662-663"
status: seed
spade: simulated
tags: [digital, fixed-point-computation-of-ey, exponential, iterative, multiplier, rectangular-multiplier, fpga]
aliases:
  - eY Reconstruction Step
  - Iterative eY Reconstruction
  - eY Reconstruction Recurrence
---

# eY Iterative Reconstruction Step

The backward half of the iterative exponential: one multiply-add per step that rebuilds $e^Y$ from the $\alpha_i$-bit table values the reduction saved, in the variable $X = E-1$ so that the leading one of $E\to1$ is never stored and every multiplier stays rectangular.

```tikz title="One reconstruction step: term alignment above, one iteration of the loop below"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ============ BAND A: where the three terms of (22.34) live ============
  \node[anchor=west,font=\small\itshape] at (-2.9,8.0) {alignment of the three terms of (22.34), drawn for $\sigma_i=2$, $\alpha_i=4$, $W=12$};

  % position ruler
  \draw[->] (0,6.9) -- (9.4,6.9);
  \foreach \x in {0,1.5,3.75,4.5,8.25} \draw (\x,6.98) -- (\x,6.82);
  \node[anchor=south,font=\footnotesize] at (0,7.32) {pos.\ $-1$};
  \draw[gray] (0,7.28) -- (0,7.02);
  \node[anchor=south,font=\footnotesize] at (1.5,7.0) {$-1-\sigma_i$};
  \node[anchor=south,font=\footnotesize] at (3.75,7.0) {$-1-\sigma_{i+1}$};
  \node[anchor=south,font=\footnotesize] at (8.25,7.0) {LSB $\ell$};
  \node[anchor=west,font=\footnotesize] at (9.5,6.9) {decreasing weight};

  % guides
  \draw[gray!45,dashed] (1.50,3.3) -- (1.50,6.85);
  \draw[gray!45,dashed] (3.75,3.3) -- (3.75,6.85);
  \draw[gray!45,dashed] (4.50,3.3) -- (4.50,6.85);
  \draw[gray!45,dashed] (8.25,3.3) -- (8.25,6.85);

  % X_i^dagger : alpha_i bits, straight from the reduction step's table
  \draw[fill=black!8] (1.5,5.9) rectangle (4.5,6.4);
  \foreach \x in {2.25,3.0,3.75} \draw[gray] (\x,5.9) -- (\x,6.4);
  \node[anchor=east] at (1.4,6.15) {$X_i^\dagger$};
  \node[anchor=west,font=\footnotesize] at (9.9,6.15) {$\alpha_i$ bits, from the table};

  % X_{i+1} : w_{i+1} bits, from the previous reconstruction step
  \draw[fill=black!8] (3.75,5.15) rectangle (8.25,5.65);
  \node[anchor=east] at (3.65,5.4) {$X_{i+1}$};
  \node[anchor=west,font=\footnotesize] at (9.9,5.4) {$w_{i+1}=W-\sigma_{i+1}$ bits};

  % the single shared column
  \draw[fill=black!30] (3.75,5.9) rectangle (4.5,6.4);
  \draw[fill=black!30] (3.75,5.15) rectangle (4.5,5.65);

  % product
  \draw[fill=black!8] (6.0,4.4) rectangle (8.25,4.9);
  \draw[dashed] (8.25,4.4) rectangle (9.75,4.9);
  \node[anchor=east,align=right,fill=white,inner sep=1.5pt] at (5.9,4.65) {$X_{i+1}\times X_i^\dagger$\\[-1pt]\footnotesize MSB at $-2-\sigma_i-\sigma_{i+1}$};
  \node[anchor=west,font=\footnotesize] at (9.9,4.65) {tail below $\ell$ is dropped};

  % X_i
  \draw[fill=black!8] (1.5,3.6) rectangle (8.25,4.1);
  \node[anchor=east] at (1.4,3.85) {$X_i$};
  \node[anchor=west,font=\footnotesize] at (9.9,3.85) {$w_i=w_{i+1}+\alpha_i-1$ bits};

  \node[anchor=west,font=\footnotesize] at (-2.9,3.15) {the shaded column is shared: $X_i^\dagger$'s LSB sits exactly at $X_{i+1}$'s MSB, so the two words abut and the ``add'' is mostly a concatenation};

  \draw[dashed,gray] (-2.9,2.75) -- (13.6,2.75);

  % ============ BAND B: one iteration of the loop ============
  \node[anchor=west,font=\small\itshape] at (-2.9,2.45) {one iteration, run with \emph{decreasing} $i$};

  % X-dagger LIFO
  \draw (-1.6,1.4) rectangle (1.4,2.2);
  \node[align=center,font=\footnotesize] at (-0.1,1.8) {$X^\dagger$ LIFO\\[-1pt] $n$ words $\times\ \alpha_i$ bits};
  \draw[->] (-0.1,1.4) -- (-0.1,1.15);

  % accumulator register
  \draw (4.6,1.4) rectangle (7.4,2.2);
  \node[font=\footnotesize] at (6.0,1.8) {\texttt{reg} $X$, $w_{i+1}$ bits};
  \draw[->] (6.0,1.4) -- (6.0,1.15);
  \draw[->] (8.65,1.8) -- (7.4,1.8);
  \node[anchor=west,font=\footnotesize] at (8.75,1.8) {seed $X_n=e^{L_n}-1$};

  % into the multiplier
  \draw (-0.1,1.15) -- (1.5,1.15); \draw[->] (1.5,1.15) -- (1.5,0.95);
  \draw (6.0,1.15) -- (4.3,1.15); \draw[->] (4.3,1.15) -- (4.3,0.95);
  % bypasses
  \draw (-0.1,1.3) -- (-2.2,1.3) -- (-2.2,-0.05); \draw[->] (-2.2,-0.05) -- (-2.2,-0.35);
  \draw (6.0,1.3) -- (8.2,1.3) -- (8.2,-0.05); \draw[->] (8.2,-0.05) -- (8.2,-0.35);

  % multiplier
  \draw (0.9,0.15) rectangle (5.1,0.95);
  \node[font=\footnotesize,align=center] at (3.0,0.55) {$\times$\ \ rectangular $w_{i+1}\times\alpha_i$\\[-1pt] product truncated at LSB $\ell$};
  \draw[->] (3.0,0.15) -- (3.0,-0.35);
  \node[anchor=west,font=\footnotesize] at (3.1,-0.15) {$w_{i+1}-\sigma_i-1$ bits};

  % adder
  \draw (-2.9,-1.15) rectangle (8.9,-0.35);
  \node[font=\footnotesize] at (3.0,-0.75) {$+$\ \ three-input add \ \ $X_i = X_{i+1}\times X_i^\dagger + X_{i+1} + X_i^\dagger$ \ \ (22.34)};
  \draw[->] (3.0,-1.15) -- (3.0,-1.8);
  \node[anchor=west,font=\footnotesize] at (3.1,-1.5) {$X_i$, \ $w_i$ bits, LSB $\ell$};

  % feedback
  \draw (3.0,-1.8) -- (12.2,-1.8) -- (12.2,2.62) -- (6.0,2.62); \draw[->] (6.0,2.62) -- (6.0,2.2);
  \node[anchor=west,font=\footnotesize,align=left] at (12.35,0.4) {$i \leftarrow i-1$\\[2pt] $n\approx\dfrac{W}{\alpha-1}$ cycles};

  % final output
  \draw[->] (3.0,-1.8) -- (0.0,-1.8) -- (0.0,-2.4);
  \node[anchor=north,font=\footnotesize,align=center] at (0.6,-2.45) {at $i=0$: \ $e^{Y}=e^{L_0}\approx X_0+1$\\[-1pt] the leading $1$ is never stored; the final $+1$ is one inverter --- prepend $\overline{b_{-1}}$ to $X_0$'s bits};
\end{circuitikz}
\end{document}
```

*My own construction from (22.32)–(22.34), pp. 662–663; the book gives no figure for the reconstruction datapath. Throughout, $W=w_F+g$ is the width of the reduced argument, $\ell=-W$ is the common LSB of every word, and $\sigma_i=\sum_{j<i}(\alpha_j-1)$ counts the leading positions the [[eY Iterative Reduction Step]] has already cancelled, so $L_i$ and $X_i$ have their MSB at position $-1-\sigma_i$.*

**Change variable so the leading one is never spent on wires.** The reduction drives $L_i\to0$, so on the way back $E_i=e^{L_i}\to1$: every $E_i$ is a leading one followed by a run of zeros followed by the bits that actually carry information. Storing that is waste, and multiplying by it is worse. Store instead $X^\dagger = E^\dagger-1$ and carry $X_i = E_i-1$. The reduction's $L_{i+1}=L_i-L_i^\dagger$ exponentiates, by $e^{a+b}=e^ae^b$, to $E_i = E_{i+1}\times E_i^\dagger$; substituting $E=1+X$ on both sides,

$$1+X_i = (1+X_{i+1})(1+X_i^\dagger)$$

and expanding the right-hand side by distributivity of $\times$ over $+$ gives $1 + X_{i+1} + X_i^\dagger + X_{i+1}X_i^\dagger$. The $1$ cancels on both sides, leaving

$$X_i = X_{i+1}\times X_i^\dagger + X_{i+1} + X_i^\dagger \qquad (22.34)$$

This change of variable is algebraically exact — it introduces no approximation error of its own, only a different bit layout. What it buys is that the redundant leading one is gone from every word, from the table $X_i^\dagger$, and from both multiplier operands.

**Both operands of the step are known before the step runs, and one of them is free.** $X_{i+1}$ is the previous reconstruction step's output. $X_i^\dagger$ is not recomputed here at all: it is the first of the two ROM outputs the [[eY Iterative Reduction Step]] already produced when it consumed the subword $A_i$, on its way to $L_{i+1}$. The reduction pass therefore emits a stream of $n$ words of $\alpha_i$ bits which the reconstruction pass consumes *in the reverse order*. That reversal is the entire loop-control cost of this recurrence, and it is a LIFO of $n\times\alpha_i \approx W + n$ bits — smaller than the $L$ datapath the reduction was carrying anyway.

**The three terms of (22.34) barely overlap, so the "add" is mostly a concatenation.** With MSB positions read off the reduction's cancellation count: $X_i^\dagger$ occupies positions $-1-\sigma_i$ down to $-\sigma_i-\alpha_i$, which by $\sigma_{i+1}=\sigma_i+\alpha_i-1$ is exactly $-1-\sigma_{i+1}$ — the MSB of $X_{i+1}$. The two words meet in one shared column and are otherwise disjoint. The product is smaller still: its MSB sits at $(-1-\sigma_i)+(-1-\sigma_{i+1}) = -2-\sigma_i-\sigma_{i+1}$, a further $1+\sigma_i$ positions down, and its tail below $\ell$ is discarded. So $X_i$ is $w_{i+1}+\alpha_i-1$ bits wide, its top $\alpha_i-1$ bits come from $X_i^\dagger$ alone, and only the bottom $w_{i+1}-\sigma_i-1$ bits see three contributors. A full-width three-input adder over $w_i$ bits is the wrong picture; what is needed is one $(w_{i+1}-\sigma_i-1)$-bit compression followed by a carry propagation that thins out towards the MSB ([[Adders]]).

**The product vanishes entirely in the first half of the reconstruction.** The product is representable at all only while its MSB is at or above $\ell=-W$, i.e. while $\sigma_i+\sigma_{i+1}\le W-2$. With a uniform subword width $\alpha$ this is $(2i+1)(\alpha-1)\le W-2$, i.e. $i\lesssim n/2$ where $n\approx W/(\alpha-1)$. Reconstruction runs from $i=n-1$ downward, so its **first $\approx n/2$ steps carry no multiplier at all** — $X_i$ is literally $X_i^\dagger$ concatenated onto $X_{i+1}$ there. The multiplications appear only as $i$ approaches $0$ and the two operands grow back towards each other.

**All $n$ multipliers together cost less than one full multiplier — but only if you unroll.** Take the cost of a rectangular multiplier to be its partial-product count, the product of its operand widths ([[Multipliers]], [[Multiplier Tiling]]). With uniform $\alpha$ and $w_{i+1}=W-(i+1)(\alpha-1)$,

$$\sum_{i=0}^{n-1}\alpha\,w_{i+1} \;=\; \alpha\left[nW - (\alpha-1)\frac{n(n+1)}{2}\right] \;=\; \alpha W\,\frac{n-1}{2} \;\approx\; \frac{\alpha}{\alpha-1}\cdot\frac{W^2}{2}$$

using $n(\alpha-1)=W$ in the middle step. For $\alpha=6$ that is $0.6\,W^2$, against $W^2$ for one $W\times W$ multiplier, and truncating the products at $\ell$ removes more still. That is the book's claim, and it is what makes the architecture defensible at all: $n$ multipliers, one full multiplier's worth of silicon. It only holds for the **unrolled or pipelined** form, where each step gets a multiplier sized to its own $w_{i+1}$. Folded onto one datapath — the loop in the diagram — you must build the widest step, a single $W\times\alpha$ rectangular multiplier, reuse it $n$ times, and accept $n$ cycles of latency; that is far *cheaper* in area than the unrolled form and far slower. The two readings of "cost" are not in conflict, but they are not the same number.

> [!warning] No error analysis for this family in the source
> §22.5.1 telescopes a seven-term error budget for the higher-order architecture; §22.5.5 gives none. Each reconstruction step drops a product tail below $\ell$, each table entry $X_i^\dagger$ is rounded to $\alpha_i$ bits, and both errors are then amplified by the remaining $\prod(1+X_j^\dagger)$ — so $\bar\delta_{\mathrm{arch}}$ grows with $n$ and the guard-bit count $g$ needed here cannot be read off the book. Neither can any LUT, DSP or delay figure: p. 663 states that "a detailed comparison on the same technology of this iterative architecture and a polynomial-based one is currently missing." Do not carry §22.5.1's $4.7u$ across.

**Where it wins.** On a LUT-only FPGA, set $\alpha_i$ to the LUT input width and each of the two tables of the reduction step is exactly one LUT level deep, which is the cheapest function evaluation the fabric can express ([[FPGAs]]). $\alpha$ is then a single clean knob: larger $\alpha$ means $2^{\alpha}$-entry tables and fewer iterations, smaller $\alpha$ means the reverse, and $n\approx W/(\alpha-1)$ makes the trade explicit.

**Where it loses.** On a modern DSP-and-BRAM FPGA it is a poor match in both directions at once ([[DSP Blocks]]). Size $\alpha_i$ for the LUTs or the memories and the rectangular $w_{i+1}\times\alpha_i$ multipliers are far too thin to fill a hard multiplier — an $18\times18$ block used at $\alpha=6$ wastes two thirds of its width. Size $\alpha_i$ to fill the DSPs instead and the $2^{\alpha_i}$-entry tables explode. There is no setting of the one knob that satisfies both hard blocks, which is why [[Higher-Order eY Architecture]] and [[eY DSP and BRAM Mapping]] are preferred there. On ASIC the objection is latency instead: the book names the additions of the reduction's $L_i$ datapath as the critical path and sends the reader to high-radix [[Redundant Number Systems]]; the same applies here, since the natural remedy is to keep $X_i$ in carry-save across steps and resolve the redundancy once, at $i=0$.

$$\boxed{\ X_i = X_{i+1}X_i^\dagger + X_{i+1} + X_i^\dagger,\qquad w_i = w_{i+1}+\alpha_i-1,\qquad \sum_{i}\alpha_i w_{i+1}\approx\frac{\alpha}{\alpha-1}\cdot\frac{W^2}{2}\ }$$

**When it breaks.**

- $\alpha$ has a floor and a ceiling. Below about $\alpha=4$ the iteration count $n\approx W/(\alpha-1)$ and the per-step loop overhead dominate; above the fabric's LUT width the $2^{\alpha}$ tables grow faster than the iteration count falls. The limit $\alpha=1$ is [[CORDIC]] — one bit of convergence per step, no multiplier at all, $W$ iterations.
- The "one full multiplier" accounting is an unrolled-area statement. A folded loop pays one $W\times\alpha$ multiplier and $n$ cycles; do not quote the two costs as if they were alternatives to the same design.
- Both $L$ and $X$ are signed: $Y\in[-\tfrac12,\tfrac12]$ gives $X_0=e^Y-1\in[-0.394,\,0.649]$, so every word here is `sfix`$(-1-\sigma_i,\ell)$, not `ufix` ([[Number Formats]]). Only the final result crosses back to unsigned.
- The accumulated truncation error is unbounded by the source — see the warning. At small $W$ this is a footnote; at $W=27$ with $n\approx6$ it is the thing that decides $g$, and it needs deriving before the architecture can be trusted ([[Error Accuracy]]).
- The LIFO is free only when the reduction and reconstruction passes are fused into one pipeline, where it degenerates into wires between stages. Fold the operator to save area and the storage becomes real, and its depth $n$ is now a design parameter of its own.

**RTL (Spade).**

```spade
/// One reconstruction step of (22.34): X_i = X_{i+1}*X_i^dag + X_{i+1} + X_i^dag.
/// Every value is a fixed-point word; l is the common LSB of the datapath.
///   x_next = X_{i+1} : WN bits, LSB at l, MSB at l+WN-1
///   x_dag  = X_i^dag : A  bits, LSB at l+WN-1  (it abuts x_next's MSB)
///   result = X_i     : WN+A-1 bits, LSB at l
/// S = sigma_{i+1} is the number of already-cancelled leading positions, so the
/// product's natural LSB sits S+1 places below l and is dropped.
entity recon_step<#uint WN, #uint A, #uint S>(
    x_next: int<WN>,
    x_dag: int<A>,
) -> int<{WN + A - 1}> {
    let zeros: int<{WN - 1}> = 0;
    let placed: int<{A + WN - 1}> = x_dag.concat(zeros);
    let carried: int<{A + WN - 1}> = sext(x_next);
    let wide: int<WN> = sext(x_dag);
    let prod: int<{2 * WN}> = x_next * wide;
    let aligned: int<{A + WN - 1}> = trunc(prod >>> (S + 1));
    placed +. carried +. aligned
}

/// Exit of the loop at i = 0: e^Y = 1 + X_0.
/// X_0 is sfix(-1, l); the result is ufix(0, l). Adding one is one inverter:
/// the sign bit's weight flips from -1/2 to +1/2 and the carry it owes lands
/// in the new position-0 bit, so bit 0 is the complement of the sign bit.
entity add_leading_one<#uint W>(x0: int<W>) -> uint<{W + 1}> {
    let s = x0.sign_bit();
    (!s).as_uint().concat(x0.as_uint())
}
```

`x_next` and `x_dag` are the two shaded bars of the diagram; `placed` is the concatenation that puts $X_i^\dagger$ at its own weight, so the `+.` chain is the three-input adder and the whole entity is combinational — one iteration, not the loop. The width arithmetic is the diagram's: `WN + A - 1` out for `WN` and `A` in, and `prod >>> (S + 1)` is the truncation of the product tail below $\ell$, whose surviving part is only $w_{i+1}-\sigma_i-1$ bits wide however wide `trunc` leaves it. Spade's `*` insists on equal operand widths, so the source sign-extends `x_dag` to `WN` and the emitted Verilog shows a square multiply; the extension bits all share one select signal, so synthesis collapses them back towards the rectangular $w_{i+1}\times\alpha_i$ array the drawing asks for — an explicit rectangular signed multiplier is still what the architecture wants from a generator.

Verified with `.zettel/sim.sh` on the concrete instance `recon_step::<10, 5, 6>` ($\ell=-16$, $\alpha_i=5$, $\sigma_{i+1}=6$, $\sigma_i=2$): **21 440 vectors pass**, made of 8 named asymmetric vectors (including $X_{i+1}=256,\,X_i^\dagger=1$ and $X_{i+1}=1,\,X_i^\dagger=15$, which an operand swap or a reversed bit order fails), a 2048-vector structured sweep with $X_i^\dagger$ exhaustive, a 3000-vector random sweep against an independently written behavioural reference, and all 16 384 values of $X_0$ through `add_leading_one::<14>` — the one-inverter claim above is exhaustively checked, not asserted. Perturbing $S$ by one place makes 4750 of the 5056 step vectors fail, so the alignment really is what the testbench is testing.

**Related Notes.**

- [[eY Iterative Reduction Step]] – depends-on: produces the $\alpha_i$-bit $X_i^\dagger$ this step consumes, and fixes $\sigma_i$, hence every width here.
- [[Choosing an eY Architecture]] – compares: where the iterative family sits against the table-and-multiplier ones, and the fabrics that decide it.
- [[Higher-Order eY Architecture]] – counter-example: one table, one near-square multiplier and a closed error budget, which is strictly the better trade wherever DSP blocks exist.
- [[CORDIC]] – compares: the $\alpha=1$ limit of the same $E_{i+1}=E_iE_i^\dagger$ recurrence, trading the multiplier away for one iteration per bit.
- [[Multipliers]] – depends-on: the rectangular multiplier is the primitive, and its partial-product count is the cost model used above.
- [[Multiplier Tiling]] – supports: how a $w_{i+1}\times\alpha_i$ rectangle is actually covered by hard or soft multiplier tiles.
- [[DSP Blocks]] – counter-example: the hard block this architecture cannot fill at any setting of $\alpha_i$.
- [[Redundant Number Systems]] – extends: keeps $X_i$ in carry-save between steps so the recurrence is not a chain of carry propagations.
- [[eY DSP and BRAM Mapping]] – compares: what the same operator costs when it is built to land on one BRAM and one DSP instead.
- [[Number Formats]] – supports: the `sfix`/`ufix` notation and the sign handling of $X_i$.
- [[Error Accuracy]] – supports: the framework the missing error budget of this family would have to be written in.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.5 "Iterative Computation of $e^Y$ Using Small Tables and Rectangular Multipliers" — pp. 662–663 (eqs. 22.32–22.34; Fig. 22.8 for the $L_i$ subword split; the LUT-fabric match, the DSP/BRAM mismatch, and the ASIC critical path)
- §22.5.6 "To Read Further" — pp. 663–664 (CORDIC as a variant of (22.32) converging one bit at a time; [Mul16])
- §22.5.1 — pp. 655–659, for the error-budget method this section does not repeat

Cited within: [Mul16] (survey of iterative and table methods), [Erc73], [PEB03], [PEB04] (high-radix redundant iterative exponential).
