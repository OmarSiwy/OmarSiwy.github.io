---
title: "Floating-Point Power Operator"
description: "X^p as a p-bit normalization plus a square-and-multiply significand chain, with the exponent handled by a small constant multiplier off the critical path."
kind: circuit
source: "ASA §15.3, pp. 467-469"
status: seed
spade: simulated
tags: [digital, floating-point-specialization, floating-point, normalization, constant-multiplication]
aliases:
  - X^p Operator
  - Floating-Point Squarer
  - Floating-Point Cuber
  - Floating-Point Power
  - FPPow
---

# Floating-Point Power Operator

A single-input operator computing $X^p$ for a small compile-time integer $p$, distinguished from a chain of $p-1$ multipliers by the fact that the *only* variable operand is $X$ itself, so the sign, the exponent and the normalization amount are all functions of $X$ alone and can be resolved in parallel with the significand.

```tikz title="X^p operator datapath, and the significand range for p=3 showing the p-1 normalization borders"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
\footnotesize
% ============ left: the X^p datapath ============
\node[font=\small] at (3.4,10.6) {\textbf{$X^p$ operator}};
\node[draw,minimum width=10.2cm,minimum height=0.75cm] (up) at (3.4,8.4) {unpack \& exception handling};
\draw[<-] (up.north) -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} ++(0,0.75) node[above,font=\small]{$X$};

% --- sign
\node[draw,minimum width=2.0cm,minimum height=0.95cm,align=center] (sg) at (-1.4,6.9)
  {$s_R$\\[-2pt]{\tiny $0$ if $p$ even, $s_X$ if $p$ odd}};
\draw[->] (-1.4,8.02) -- node[left,font=\tiny]{$s_X$} (sg.north);

% --- significand: square-and-multiply
\node[draw,minimum width=3.0cm,minimum height=0.95cm,align=center] (sq) at (1.6,5.9)
  {square-and-multiply\\[-2pt]{\tiny $M^2,\ M^4,\ \dots\ \Rightarrow\ M^p$}};
\draw[->] (1.6,8.02) -- node[left,font=\tiny,align=left]{$M{=}1{+}F_X$\\$w_F{+}1$} (sq.north);

% --- normalization predictor (off the critical path)
\node[draw,minimum width=3.1cm,minimum height=0.85cm,align=center] (cmp) at (5.0,7.0)
  {$p{-}1$ constant comparators\\[-2pt]{\tiny $F_X \lessgtr \sqrt[p]{2^i}-1$}};
\node[draw,minimum width=3.1cm,minimum height=0.55cm] (pri) at (5.0,5.9) {priority encoder};
\draw[->] (cmp.south) -- node[right,font=\tiny]{$p{-}1$} (pri.north);
\draw[->] (5.0,8.02) -- node[right,font=\tiny]{$F_X$: $w_F$} (cmp.north);

% --- exponent path
\node[draw,minimum width=1.9cm,minimum height=0.6cm] (ce) at (8.2,7.0) {$\times p$ (shift-add)};
\node[draw,minimum width=1.9cm,minimum height=0.6cm] (ea) at (8.2,5.9) {$+\,s$};
\draw[->] (8.2,8.02) -- node[right,font=\tiny]{$E_X$: $w_E$} (ce.north);
\draw[->] (ce.south) -- node[right,font=\tiny]{$w_E{+}\lceil\log_2 p\rceil$} (ea.north);

% --- normalizer + round
\node[draw,minimum width=3.0cm,minimum height=0.85cm,align=center] (nrm) at (1.6,4.35)
  {$p$-bit normalizer\\[-2pt]{\tiny barrel shift right by $s$}};
\draw[->] (sq.south) -- node[left,font=\tiny]{$p(w_F{+}1)$} (nrm.north);

\draw[->] (pri.south) -- (5.0,5.15) -- node[above,font=\tiny,pos=0.22]{$s$: $\lceil\log_2 p\rceil$}
          (2.6,5.15) -- (2.6,4.78);
\draw[->] (5.0,5.15) -- (7.0,5.15) -- (7.0,5.9) -- (ea.west);

\node[draw,minimum width=3.0cm,minimum height=0.6cm] (rnd) at (1.6,3.1) {round to $w_F$};
\draw[->] (nrm.south) -- node[left,font=\tiny]{$\mathrm{ufix}(0,-p\,w_F)$} (rnd.north);

\node[draw,minimum width=10.2cm,minimum height=0.75cm] (pk) at (3.4,1.9) {exception handling \& pack};
\draw[->] (rnd.south) -- node[left,font=\tiny]{$F_R$: $w_F$} (1.6,2.28);
\draw[->] (ea.south) -- node[right,font=\tiny]{$E_R$: $w_E$} (8.2,2.28);
\draw[->] (sg.south) -- (-1.4,2.28);
\draw[->] (pk.south) -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} ++(0,-0.6) node[below,font=\small]{$R=X^p$};

\draw[dashed,gray] (3.28,7.85) -- (3.28,2.95);
\node[font=\tiny,align=left,anchor=north west] at (-2.6,0.45)
 {Left of the dashed line is the critical path. The comparator/encoder pair resolves $s$ from $F_X$ alone,\\
  in parallel with the significand chain, so exponent processing never joins the critical path.};

% ============ right: significand range and the p-1 borders ============
\begin{scope}[xshift=12.0cm,yshift=3.2cm]
  \node[font=\small,anchor=south] at (1.6,4.9) {\textbf{significand range,} $p=3$};
  \draw[->] (0,0) -- (3.7,0) node[anchor=north,font=\tiny] {$F_X$};
  \draw[->] (0,0) -- (0,4.25) node[anchor=south,font=\tiny] {$(1{+}F_X)^3$};
  \node[anchor=north,font=\tiny] at (0,-0.05) {$0$};
  \node[anchor=north,font=\tiny] at (3.2,-0.05) {$1$};
  \foreach \y/\l in {0.45/1, 0.90/2, 1.80/4, 3.60/8}
    \draw (-0.07,\y) -- (0.07,\y) node[anchor=east,font=\tiny,xshift=-3pt] {$\l$};
  \draw[very thick] plot[smooth] coordinates
    {(0,0.450) (0.32,0.598) (0.64,0.778) (0.96,0.990) (1.28,1.238)
     (1.60,1.519) (1.92,1.838) (2.24,2.195) (2.56,2.592) (2.88,3.031)
     (3.20,3.600)};
  \draw[dashed,gray] (0,0.90) -- (0.832,0.90) -- (0.832,0);
  \draw[dashed,gray] (0,1.80) -- (1.879,1.80) -- (1.879,0);
  \node[anchor=north,font=\tiny] at (0.832,-0.05) {$\sqrt[3]{2}{-}1$};
  \node[anchor=north,font=\tiny] at (1.879,-0.05) {$\sqrt[3]{4}{-}1$};
  \draw[<->,gray] (0.02,4.00) -- (0.81,4.00);
  \draw[<->,gray] (0.85,4.00) -- (1.86,4.00);
  \draw[<->,gray] (1.90,4.00) -- (3.18,4.00);
  \node[font=\tiny,anchor=south] at (0.42,4.05) {$s{=}0$};
  \node[font=\tiny,anchor=south] at (1.36,4.05) {$s{=}1$};
  \node[font=\tiny,anchor=south] at (2.54,4.05) {$s{=}2$};
  \node[font=\tiny,align=left,anchor=north west] at (-0.6,-0.85)
   {$(1{+}F_X)^p\in[1,2^p)$, so the shift $s$ is fixed by\\
    which of the $p{-}1$ borders $F_X$ exceeds. The\\
    curve is smooth and has no singularity, so a\\
    polynomial approximation can replace it when\\
    only faithful rounding is asked for.};
\end{scope}
\end{circuitikz}
\end{document}
```

*Datapath is own construction; the right-hand panel is after Fig. 15.8, p. 469, specialized to $p=3$.*

**Push the exponentiation through the format decomposition and the operator falls into three independent pieces.** For $X = (-1)^{s_X}\,2^{E_X}(1+F_X)$ in $\mathrm{float}\langle w_E,w_F\rangle$ ([[Number Formats]]), multiplicativity of the power gives $(abc)^p = a^p b^p c^p$, and the power-of-a-power law $(2^{E_X})^p = 2^{pE_X}$ turns the exponent factor back into a floating-point exponent:

$$X^2 = 2^{2E_X}(1+F_X)^2,\qquad X^3 = (-1)^{s_X}2^{3E_X}(1+F_X)^3,\qquad X^p = (-1)^{p\,s_X}2^{pE_X}(1+F_X)^p$$

Nothing here is an approximation; the three factors do not interact, which is exactly what a generic multiplier cannot assume when its two operands are unrelated. The whole design consists of implementing each factor at its own cost.

**The sign costs nothing because $(-1)^{p s_X}$ depends only on the parity of $p$.** Since $(-1)^{2k}=1$, the exponent $p\,s_X$ reduces mod 2 to $0$ when $p$ is even and to $s_X$ when $p$ is odd. Both are compile-time choices: the sign path is a constant `0` wire or a straight-through of the 1-bit $s_X$, and there is no XOR gate. Compare a generic multiplier, which spends one XOR on $s_X \oplus s_Y$, and even the specialized [[Faithful Floating-Point Constant Multiplier]], which still folds $s_C$ into the sign.

**The exponent path is a multiplication by a small integer constant, which is a handful of shifts and adds.** Writing $p$ in binary and applying distributivity of $\times$ over $+$, $pE_X = \sum_{j:\,p_j=1} 2^j E_X$, so $3E_X = (E_X\!\ll\!1) + E_X$ and $5E_X = (E_X\!\ll\!2)+E_X$ — one adder each, no multiplier ([[Multiplication by Constants]]). The width grows from $w_E$ to $w_E + \lceil\log_2 p\rceil$ bits, which is precisely the room the operator needs to detect overflow and underflow: for $p=3$ and $w_E=8$ the internal exponent is 10 bits and the exception logic reads the two extra bits. There is no bias correction to undo, because the bias is subtracted once on unpacking rather than $p$ times.

**Input subnormals are free; output subnormals are not.** A subnormal input has magnitude below $2^{e_{\min}}$, so $|X|^p < 2^{p\,e_{\min}}$, which underflows to zero for every $p \ge 2$ — the operator can flush the whole subnormal input range without any datapath at all. The reverse is not symmetric: producing subnormal *outputs* requires saturating the exponent at $e_{\min}$ and denormalizing the significand by the residual shift, which is real hardware ([[Saturated Normalizer]], and the same asymmetry appears in [[Constant Multiplier with Subnormal Support]]). The book flags this explicitly as the one place where $X^p$ stops being cheap (p. 468).

**The significand is the whole cost, and its range is what forces a $p$-bit normalization.** With $M = 1+F_X \in [1,2)$, monotonicity of $x \mapsto x^p$ on the positives gives $M^p \in [1, 2^p)$, so the result can need a right shift of anywhere from $0$ to $p-1$ bits to land back in $[1,2)$. That is a $p$-bit [[Normalizers|normalizer]] — for $p=2$ a single multiplexer, exactly the 1-bit post-normalization of a generic multiplier, but for $p=5$ a 3-bit barrel shifter ([[Shifters]]). Built naively the normalizer is fed by a leading-zero counter, and the LZC sits *after* the significand product: it cannot start until the last bit of $M^p$ is stable, so it adds its full depth to the critical path.

**Predict the shift from $F_X$ instead of counting leading zeros in $M^p$.** Because $x \mapsto (1+x)^p$ is strictly increasing on $[0,1)$, it is a bijection onto $[1,2^p)$ and the preimage of each dyadic band $[2^i, 2^{i+1})$ is a single interval. Inverting the boundary condition $(1+F_X)^p = 2^i$ by taking $p$-th roots — legitimate because both sides are positive and $\sqrt[p]{\cdot}$ is increasing — puts the $p-1$ borders at

$$F_X = \sqrt[p]{2^i}-1,\qquad i \in \{1,\dots,p-1\}$$

so the shift amount is $s = \#\{\,i : F_X > \sqrt[p]{2^i}-1\,\}$. Concretely $X^2$ needs a 1-bit normalization iff $F_X > \sqrt2 - 1$; $X^3$ needs 1 bit iff $\sqrt[3]2 - 1 < F_X < \sqrt[3]4 - 1$ and 2 bits iff $F_X > \sqrt[3]4 - 1$. Each test is a comparison of the $w_F$-bit $F_X$ against a hardwired constant, which is cheap combinational logic ([[Comparators]], §6.3.3). All $p-1$ comparisons run in parallel and their results are priority-encoded into $\lceil\log_2 p\rceil$ bits concurrently with the significand path, so **exponent processing leaves the critical path entirely** (p. 468).

> [!note]
> This is the [[Product Normalization Predictor]] generalized from two operands to $p$ equal ones. The generic `product normal?` block for $X \times Y$ compares against a single border derived from *both* significands; here the two significands are the same signal, so the border becomes a constant and the comparator becomes $p-1$ constant comparators on one input. Specialization did not remove the normalization — it removed the *dependency* of the normalization on the datapath's result.

**Compute the exact power by square-and-multiply, not by $p-1$ multiplications.** The exact $M^p$ is $p(w_F+1)$ bits wide — 72 bits for $p=3$, $w_F=23$ — and that width is unavoidable if the result must be correctly rounded, because a truncated intermediate destroys the tie information. What is avoidable is the *number* of multipliers: associativity of multiplication lets the product be reassociated into a binary addition chain on the exponent, $M^5 = (M^2)^2 \times M$, which is two squarers of increasing size plus one general multiplier rather than four general multiplications (§14.3.2). Squarers are themselves cheaper than multipliers by roughly a factor of two, since $M_iM_j$ and $M_jM_i$ are the same partial product and can be merged before summation ([[Squarers and Integer Powers]]) — so the chain is cheaper than the multiplier count alone suggests.

**If only faithful rounding is required, do not compute the power at all.** The right-hand panel is the point: $f(x) = (1+x)^p$ on $[0,1)$ is smooth, bounded, and has no singularity, so it is the easy case for generic [[Polynomial Approximation]] — a degree-2 or degree-3 minimax polynomial with a table-driven range split evaluates it to $1$ ulp in far less area than a $p(w_F+1)$-bit exact product (p. 469, citing [PBM01]). The exact power is needed *only* to reach $0.5$ ulp, where the last-bit decision requires knowing the exact value's position relative to the midpoint. This is the same accuracy-versus-area lever that separates [[Faithful Floating-Point Constant Multiplier]] from [[Correctly Rounded Floating-Point Constant Multiplier]]; see [[Error Accuracy]] for what the two bounds mean.

**On FPGA the balance shifts toward the exact power.** A DSP block is a fixed $18\times25$ (or $27\times18$) multiplier that is already paid for, so the square-and-multiply chain for $p=3$ at single precision costs a handful of DSP blocks and almost no fabric, whereas a polynomial evaluator spends both DSP blocks *and* block RAM for its coefficient table plus LUT fabric for the range split. The comparator/priority-encoder predictor maps to a single LUT layer, and the $p$-bit normalizer at $p\le 4$ is one or two LUT levels rather than a real barrel shifter. On ASIC, where the multipliers are not free, the polynomial route wins earlier. See [[FPGAs]].

$$\boxed{\;X^p = (-1)^{p\,s_X}\;2^{\,pE_X + s}\cdot\frac{(1+F_X)^p}{2^{s}},\qquad s = \#\{\,i \in [1,p-1] : F_X > \sqrt[p]{2^i}-1\,\}\;}$$

The right-hand factor is in $[1,2)$ by construction, so it is a valid significand; $s$ is computed from $F_X$ alone, which is the entire architectural content of the box.

**When it breaks.**

- **$p$ must be small.** The exact significand is $p(w_F+1)$ bits and the normalizer is $p$-bit; both scale linearly in $p$ while a generic $\exp(p\log X)$ evaluator does not scale in $p$ at all. Past roughly $p=8$ the specialized operator is the expensive one and a logarithm/exponential pair takes over.
- **$p$ negative or fractional is a different operator entirely.** $X^{-1}$ and $X^{1/2}$ have singular or non-polynomial behaviour on $[1,2)$ and belong to [[Digit Recurrence for Algebraic Functions]] or table-driven methods, not here. The whole predictor argument depends on $x\mapsto(1+x)^p$ being increasing with integer $p$.
- **Subnormal outputs.** As above: the flush-to-zero shortcut on inputs has no counterpart on outputs, and supporting them re-introduces a saturating exponent and a denormalizing shift.
- **Different input and output formats.** The $[1,2^p)$ range argument assumes $w_F$ is the same on both sides. If the output format is wider, the $p$ borders are still correct but the rounding step is not the trivial truncation the chapter assumes (p. 453).
- **The border constants are irrational.** $\sqrt[p]{2^i}-1$ has no finite binary expansion, so the hardwired comparison constants are themselves rounded to $w_F$ bits. Rounding them *toward* the correct side of the border is mandatory — round the wrong way and a single $F_X$ value gets the wrong $s$, producing a result off by a factor of two. See the RTL note below.
- **$p=2$ is not really this note.** For a squarer the predictor degenerates to one comparison and the normalizer to one mux, which is what a generic multiplier already has; the interesting content starts at $p=3$.

**RTL (Spade).**

```spade
// X^3 core: significand square-and-multiply + predicted normalization + 3*E
entity fp_pow3(fx: uint<8>, ex: int<8>) -> (uint<8>, int<12>) {
    // significand M = 1 + F_X, ufix(0,-8) held as uint<9>
    let m: uint<9> = 1u1.concat(fx);

    // square-and-multiply: M^2 then M^2 * M, exact, 36-bit product
    let m2: uint<18> = m * m;
    let m3: uint<36> = m2 * zext::<9, 18>(m);

    // normalization predictor: compare F_X against cbrt(2^i)-1, i in {1,2}
    let s: uint<2> = if fx >= 151 { 2 } else { if fx >= 67 { 1 } else { 0 } };

    // normalize by s, keep the 8 fraction bits below the hidden 1 at weight 2^24
    let n = m3 >> zext::<2, 36>(s);
    let fr: uint<8> = n.as_bits()[16..24].as_uint();

    // exponent: 3*E_X = (E_X << 1) + E_X, plus the predicted shift
    let e: int<10> = sext(ex);
    let e3: int<11> = (e <<. 1) + e;
    let eo: int<12> = trunc(sext::<11, 12>(e3) + sext::<3, 12>(s.to_int()));

    (fr, eo)
}
```

`fx` and `ex` are the unpacked $F_X$ and $E_X$ from the diagram's top block, at $w_F=8$, $w_E=8$; `m` is the hidden-bit concatenation that forms $M$, `m2`/`m3` are the square-and-multiply chain, `s` is the predictor output, and the shift plus bit-slice is the $p$-bit normalizer. Width arithmetic: $M$ is $w_F+1=9$ bits, $M^2$ is $2\times 9=18$, and $M^3$ needs $M^2$ zero-extended to 18 before `*` (Spade requires equal operand widths), giving $36 \ge p(w_F+1)=27$ bits — the top 9 are always zero and synthesis prunes them. The block is purely combinational; `<<.` is the truncating shift that keeps the exponent at 10 bits, and `trunc` on the last line discards the sign-extension bit that `+` would otherwise add.

The two magic constants are the note's whole argument in integer form: $\sqrt[3]2-1 = 0.2599\ldots$ and $\sqrt[3]4-1 = 0.5874\ldots$ scaled by $2^8$ are $66.54$ and $150.37$, and both must round **up** to $67$ and $151$ so that the comparison is $\ge$ on the correct side — $F_X = 66$ gives $M^3 = 1.9954 < 2$ and must not be shifted. Synthesis will do one thing differently from the drawing: the `if`-chain is written as a priority cascade but the comparisons are independent and disjoint, so the tool flattens it into two parallel constant comparators feeding one LUT, which is the parallel structure the diagram shows and the reason $s$ is ready before `m3` is.

**Related Notes (with context).**

- [[Product Normalization Predictor]] – extends: the $p=2$, two-operand form of the comparator trick, generalized here to $p-1$ constant borders on a single input.
- [[Squarers and Integer Powers]] – depends-on: the fixed-point substrate, where merging $M_iM_j$ with $M_jM_i$ is what makes the square-and-multiply chain cheaper than its multiplier count.
- [[Normalizers]] – depends-on: the $p$-bit shifter this operator needs, and the leading-zero-count structure the predictor exists to bypass.
- [[Polynomial Approximation]] – compares: the cheaper route to a faithful $(1+x)^p$, and the reason the exact power is only justified by correct rounding.
- [[Saturated Normalizer]] – supports: the extra hardware required if subnormal outputs must be produced rather than flushed.
- [[Faithful Floating-Point Constant Multiplier]] – compares: the same accuracy-versus-area lever on a two-input specialization.
- [[Correctly Rounded Floating-Point Constant Multiplier]] – compares: what the $0.5$ ulp requirement costs when the exact product must be retained.
- [[Constant Multiplier with Subnormal Support]] – compares: the same input-easy / output-hard subnormal asymmetry.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where $X^p$ sits among the chapter's specializations.
- [[Multiplication by Constants]] – supports: the $\times p$ exponent path, a shift-and-add graph rather than a multiplier.
- [[Comparators]] – supports: the $p-1$ constant comparisons that constitute the predictor.
- [[Shifters]] – supports: the barrel shifter the $p$-bit normalization becomes once $p > 2$.
- [[Error Accuracy]] – depends-on: the $1$ ulp versus $0.5$ ulp distinction that selects between the polynomial and the exact power.
- [[Number Formats]] – depends-on: the $(-1)^{s}2^{E}(1+F)$ decomposition the whole operator is built by distributing over.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.3 *Floating-Point Squares, Cubes, and $X^p$*, pp. 467-469.
  - Eqs. (15.13)-(15.16), p. 467 — the decomposition of $X$, $X^2$, $X^3$ and $X^p$; the 1-bit normalization and single multiplexer of the squarer.
  - p. 468 — sign by parity of $p$; exponent as a small-constant multiplier; input subnormals rounding to zero for $p\ge 2$ and the extra hardware needed for subnormal outputs; the $[1,2^p)$ range and $p$-bit normalization; the $\sqrt[p]{2^i}-1$ comparison borders with the $X^2$ and $X^3$ cases spelled out; the parallel comparisons, priority encoding, and the statement that exponent processing is off the critical path as a generalization of the `product normal?` block; the $p\times(1+w_F)$ exact width and $M^5 = (M^2)^2\times M$ square-and-multiply.
  - Fig. 15.8, p. 469 — plots of $(1+x)^3$, $(1+x)^4$, $(1+x)^5$ on $[0,1)$ with the exponent borders marked; the argument that the functions have no singularity and that generic approximation is in principle cheaper than the exact power except for correct rounding, citing [PBM01].
- §10.3 — normalizers and their leading-zero-count control, cited from p. 468.
- §14.3.2 — the square-and-multiply technique, cited from p. 468.
- §6.3.3, p. 149 — comparison against a constant, the primitive the predictor is built from.
- Chap. 12 — multiplication by a constant as shifts and additions, cited from p. 468 for the exponent path.
- Fig. 11.7, p. 344 — the generic floating-point multiplier this operator is a specialization of.
- §15.1, pp. 453-464 — the constant-multiplier specializations that share the sign, exception and subnormal reasoning.
