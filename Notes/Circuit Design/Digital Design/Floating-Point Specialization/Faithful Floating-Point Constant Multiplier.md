---
title: "Faithful Floating-Point Constant Multiplier"
description: "One known operand deletes the bias subtractor, the sign XOR and the two-operand multiplier; at most one bit of normalization is ever needed, for 1 ulp."
kind: circuit
status: seed
spade: simulated
tags: [digital, floating-point-specialization]
aliases:
  - Baseline Faithful Floating-Point Multiplier by a Constant
  - Faithful FP Constant Multiplier
  - FPConstMult
---

# Faithful Floating-Point Constant Multiplier

A floating-point multiplier whose second operand is fixed at synthesis time, and whose one distinguishing trick is that the normalization decision is taken from the input fraction alone, in parallel with the significand product rather than after it.

```tikz title="Faithful floating-point multiplier by a real constant: the normalization predictor runs beside the constant multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- blocks ----
\node[draw,minimum width=8.4cm,minimum height=0.8cm] (unp) at (0,7.0) {unpack \& exception handling};
\node[draw,minimum width=2.7cm,minimum height=0.7cm] (pn)  at (-2.0,5.2) {product normal?};
\node[draw,minimum width=3.4cm,minimum height=1.0cm,align=center] (mul) at (2.8,5.2)
      {faithful multiplier\\ by $1{+}F_C$};
\node[draw,minimum width=1.8cm,minimum height=0.8cm] (eadd) at (-4.0,3.6) {$+E_C$};
\node[draw,minimum width=3.0cm,minimum height=0.7cm] (nrm) at (2.8,3.3) {1-bit norm.};
\node[draw,minimum width=8.4cm,minimum height=0.8cm] (pck) at (0,1.4) {exception handling \& pack};

% ---- top input ----
\draw[->] (0,8.3) node[above]{$X$} -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} (unp.north);

% ---- sign and exception rails ----
\draw[->] (unp.west) -- node[above,font=\tiny]{$s_X$} (-6.6,7.0) -- (-6.6,1.4) -- (pck.west);
\node[font=\tiny,anchor=west,align=left] at (-6.5,0.55) {$s_R=s_X$: no sign XOR, $C>0$ known};
\draw[->] (unp.east) -- node[above,font=\tiny]{$2$} (6.6,7.0) -- (6.6,1.4) -- (pck.east);
\node[font=\tiny,anchor=east] at (6.5,6.4) {exn};

% ---- unpack outputs ----
\draw[->] (-4.0,6.6) -- node[left,font=\tiny,pos=0.25]{$E_X{+}E_0$}
                        node[left,font=\tiny,pos=0.62]{$\mathrm{ufix}(w_E{-}1,0)$} (eadd.north);
\draw[->] (-2.0,6.6) -- node[left,font=\tiny]{$F_X$} node[right,font=\tiny]{$w_F$} (pn.north);
\draw[->] (2.8,6.6) -- node[left,font=\tiny]{$1{+}F_X$} node[right,font=\tiny]{$w_F{+}1$} (mul.north);

% ---- product normal? fan-out ----
\draw[->] (-2.4,4.85) -- (-2.4,4.3) -- node[above,font=\tiny]{$+1$} (-4.0,4.3) -- (eadd.north);
\draw[->] (-1.6,4.85) -- (-1.6,3.3) -- node[above,font=\tiny,pos=0.35]{shift?} (nrm.west);
\draw[->] (pn.east) -- node[above,font=\tiny]{rounding} node[below,font=\tiny]{position} (mul.west);

% ---- datapath down ----
\draw[->] (mul.south) -- node[right,font=\tiny]{$P:\ \mathrm{ufix}(1,-w_F)$} (nrm.north);
\draw[->] (nrm.south) -- node[right,font=\tiny]{$F_R:\ \mathrm{ufix}(-1,-w_F)$} (2.8,1.8);
\draw[->] (eadd.south) -- node[left,font=\tiny]{$E_R{+}E_0$} node[right,font=\tiny]{$\mathrm{sfix}(w_E,0)$} (-4.0,1.8);

% ---- output ----
\draw[->] (pck.south) -- node[right,font=\tiny]{$1{+}w_E{+}w_F$} (0,0.3) node[below]{$R$};
\end{circuitikz}
\end{document}
```

*after Fig. 15.3, p. 456*

**Substitute the constant and watch three blocks die.** Start from the generic [[Floating-Point Multiplier]] and put $C=(-1)^{s_C}2^{E_C}(1+F_C)$ in place of the second operand. The three datapaths become $s_R=s_X\oplus s_C$, one $w_E$-bit exponent add, and $(1+F_X)\times(1+F_C)$ on the significands. The sign XOR degenerates to a wire or an inverter, because $s_C$ is a compile-time bit. The significand multiplier becomes a constant multiplier — a [[Shift-and-Add]] graph or a [[KCM, Table-Based Constant Multiplication]] table, both from [[Multiplication by Constants]] — which is *sublinear* in the constant's size, so it is strictly cheaper than the $(w_F{+}1)\times(w_F{+}1)$ array it replaces.

**The exponent saving is an algebraic identity, not a circuit trick.** Generic multiplication receives both exponents in biased form and must undo one bias: $(E_R+E_0)=(E_X+E_0)+(E_Y+E_0)-E_0$, which costs a subtractor on the exponent path. With a constant, $E_C$ is available *unbiased* at synthesis time, so

$$(E_R+E_0)\;=\;(E_X+E_0)+E_C$$

lands directly in biased form. The bias subtractor is deleted, not shrunk. The tentative result exponent is carried on $w_E+1$ bits and read as an `sfix`: the spare bit is a sign bit detecting underflow when $E_C<0$ and an overflow bit when $E_C\ge0$, and both are caught by the same test on the sign, so `exception handling & pack` needs no extra comparator. Exception handling shrinks from range alone as well — if $C<1$ strictly the product can never overflow, and if $C>1$ it can never flush to zero, so one of the two exceptional branches always dies.

**Bound the product to get exactly one bit of normalization.** Restrict to $1<1.F_C<2$ strictly (the case $F_C=0$ is the [[Floating-Point Multiplier by a Power of Two]], where the significand path vanishes entirely) and to normal inputs, so $1\le 1.F_X\le 2-2^{-w_F}$. Then the exact product $P=(1+F_C)(1+F_X)$ lies in $[1,\,2(2-2^{-w_F}))$, strictly below $4$. Hence $P$ fits $\mathrm{ufix}(1,-w_F)$ on $w_F+2$ bits and **at most one bit of normalization** is ever needed. That single range fact is the whole architecture: no leading-zero counter, no barrel shifter, one conditional right shift by one.

**Predict that shift from the input fraction alone.** The optimization over the generic multiplier is that the shift decision does not have to wait for $P$. Define the reciprocal-derived fraction

$$1+F_{C^{-1}}\;=\;\frac{2}{1+F_C}\ \in(1,2)$$

and compare the $w_F$-bit field $F_X$ against $\lfloor F_{C^{-1}}\rfloor_{-w_F}$, the value $F_{C^{-1}}$ truncated to the input's own format. Both operands of the comparison are $w_F$-bit unsigned fixed-point numbers and one of them is a constant, so this is a constant comparison from [[Comparators]], not a general one. Three cases:

- **$F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}$.** Since $F_X$ is a multiple of $2^{-w_F}$, this means $F_X\ge\lfloor F_{C^{-1}}\rfloor_{-w_F}+2^{-w_F}>F_{C^{-1}}$. The map $t\mapsto(1+F_C)(1+t)$ is strictly increasing, so $P>(1+F_C)(1+F_{C^{-1}})=2$: shift right one bit.
- **$F_X<\lfloor F_{C^{-1}}\rfloor_{-w_F}$**, i.e. $F_X\le\lfloor F_{C^{-1}}\rfloor_{-w_F}-2^{-w_F}$. Monotonicity again, then the defining identity $1+F_{C^{-1}}=2/(1+F_C)$ in the middle step, then $1+F_C>1$ at the end:

$$(1+F_C)(1+F_X)\ \le\ (1+F_C)\!\left(1+F_{C^{-1}}-2^{-w_F}\right)\ =\ 2-2^{-w_F}(1+F_C)\ \le\ 2-2^{-w_F}$$

  No normalization.
- **$F_X=\lfloor F_{C^{-1}}\rfloor_{-w_F}$**, the limit case. Here $P$ may round up to $2$ or down to $2-2^{-w_F}$, and which one happens depends on both the constant and the internal construction of the faithful multiplier.

> [!important] The limit case is resolved at build time, not in hardware
> A *built* multiplier is a fixed circuit, so it always returns the same value for this one fraction. Construct the multiplier first, evaluate it on $1+\lfloor F_{C^{-1}}\rfloor_{-w_F}$, then wire `product normal?` as $F_X\ge\lfloor F_{C^{-1}}\rfloor_{-w_F}$ if it returned $2$ and as $F_X>\lfloor F_{C^{-1}}\rfloor_{-w_F}$ otherwise. Get this backwards and exactly one input fraction out of $2^{w_F}$ is off by a full binade — a bug that random testing will essentially never find.

**The prediction is cashed twice.** First, the exponent update $+E_C$ and its conditional $+1$ run *concurrently* with the significand product instead of waiting for it, taking the exponent path off the critical path. Second, and less obviously, the position of the rounding bit is now known early — weight $-w_F$ when the test is false, $-w_F+1$ when it is true — so the rounding addition can be dropped as one more entry into the constant multiplier's [[Bit Heaps]] compression rather than sitting downstream as a separate post-normalization adder. A post-normalization adder is $w_F+1$ bits wide and is at least as large as the constant comparator that now replaces it, so this is **delay improvement at no area cost**. See [[Rounding]] for why the two rounding-bit positions are the only two that can occur.

**On an FPGA the deletion goes further.** The $\times(1+F_C)$ core built as shift-and-add or KCM maps to LUTs and the hard carry chain, so it never occupies a DSP block, whereas the generic $(w_F{+}1)^2$ multiplier it replaces almost certainly would. The saving is therefore not only area but the release of a scarce, differently-shaped resource. On an ASIC the same substitution buys ordinary area and a shorter multiplier tree, with no resource-class effect.

$$\boxed{\ 1+F_{C^{-1}}=\frac{2}{1+F_C}\ \in(1,2),\qquad P\ge 2\iff F_X>\big\lfloor F_{C^{-1}}\big\rfloor_{-w_F}\ }$$

(with $\ge$ in place of $>$ when the built multiplier returns $2$ on the limit fraction)

**When it breaks.**

- **Subnormals.** The architecture above assumes normal inputs and normal outputs. Subnormal support needs a shifter on the way in or out; see [[Constant Multiplier with Subnormal Support]].
- **$F_C=0$.** The predictor is vacuous and the significand path is dead weight; use [[Floating-Point Multiplier by a Power of Two]].
- **Different input and output formats.** Every bound here uses the *same* $w_E$ and $w_F$ on $X$ and $R$. Widen the output and the "at most one bit of normalization" claim survives, but the rounding-position argument and the $w_E+1$-bit tentative exponent do not.
- **1 ulp is not enough.** An HLS compiler substituting this for a generic multiplier needs bit-for-bit agreement with a software run, which is $0.5$ ulp; that is [[Correctly Rounded Floating-Point Constant Multiplier]], and it roughly doubles the constant width to buy the last bit.
- **Faithful rounding is a relation, not a function.** Two faithful multipliers by the same constant may disagree on the same input, and the result is not guaranteed monotonic in $X$. If downstream logic depends on monotonicity, this operator is the wrong choice.
- **The limit fraction.** As above: one input in $2^{w_F}$, wrong by a factor of two, invisible to random vectors. It must be checked by construction.

**RTL (Spade).**

Genericity over the constant is exactly what this operator does not have, so the block below is a concrete instance: $\mathrm{float}\langle 5,8\rangle$ multiplied by $C=\pi=2^1\cdot(\pi/2)$. Every constant in it comes from the identities above, evaluated once at build time:

$$
\lfloor F_{C^{-1}}\rfloor_{-8}=\big\lfloor 2^{8}(\tfrac{4}{\pi}-1)\big\rfloor=69,
\qquad
K=\big\lfloor 2^{12}\cdot\tfrac{\pi}{2}\big\rfloor=6433
$$

```spade
// Faithful floating-point constant multiplier, float<5,8> * pi.
// Compile-time constants (C = pi = 2^1 * (pi/2), wE = 5, wF = 8):
//   K     = floor(2^12 * pi/2)      = 6433   truncated constant significand
//   FCINV = floor(2^8 * (4/pi - 1)) = 69     normalization threshold
entity fpconstmul_pi(sx: bool, ex: uint<5>, fx: uint<8>) -> uint<15> {
    let one: uint<1> = 1;
    let ix: uint<9> = one.concat(fx);          // I_X = 2^wF (1 + F_X)

    // product normal?  -- from F_X alone, in parallel with the multiplier
    let norm: bool = fx > 69;

    // truncated constant multiplier by 1 + F_C
    let k: uint<13> = 6433;
    let ixw: uint<13> = zext(ix);
    let p: uint<26> = ixw * k;                 // 2^20 * (1+F_C)(1+F_X), minus truncation

    // 1-bit normalization folded into the rounding-bit position
    let pn: uint<27> = p + 4096;               // round at -wF+1, then >>1
    let pd: uint<27> = p + 2048;               // round at -wF
    let ir: uint<9> = if norm { trunc(pn >> 13) } else { trunc(pd >> 12) };

    let fr: uint<8> = trunc(ir);               // drop the implicit leading 1
    let ec: uint<5> = if norm { 2 } else { 1 };
    let er: uint<6> = ex + ec;                 // biased in, biased out: no -E_0
    sx.as_uint().concat(er).concat(fr)
}
```

`fx > 69` is the `product normal?` box; `ixw * k` is the constant multiplier, here left for synthesis to reduce into a shift-and-add graph rather than written out as one. The two rounding constants `4096` and `2048` are the *same* rounding bit at the two positions the predictor selects between, and the `>>13` versus `>>12` is the 1-bit normalizer — in the drawing they are separate boxes, in the RTL they collapse into one mux because the shift and the round happen at the same place. `er` is $w_E+1=6$ bits wide, holding the tentative exponent the diagram labels `sfix(w_E,0)`; `trunc(ir)` discards the leading $1$ that the range argument guarantees is there. Everything is combinational; synthesis will merge the two `p + const` adders and the mux into one carry-save reduction, which is precisely the bit-heap absorption the note argues for.

Simulated against a `real`-valued reference model: **3264 vectors** — the eight named cases (including the asymmetric pair $F_X=1$ vs $F_X=128$, which a bit-reversed fraction would swap), an exhaustive sweep of all $256$ fractions, and $3000$ random $(s_X,E_X,F_X)$ triples. Maximum observed error **0.557 ulp**, comfortably inside the $1$ ulp faithful bound; the predictor was checked to agree with the exact test $P\ge2$ on every one of the $256$ fractions, and the boundary at $69/70$ was asserted directly.

**Related Notes (with context).**

- [[Floating-Point Multiplier]] – depends-on: the generic operator this specializes; the bias subtractor, sign XOR and $(w_F{+}1)^2$ array deleted here all live there.
- [[Product Normalization Predictor]] – extends: the `product normal?` block on its own, as a reusable comparator against $\lfloor F_{C^{-1}}\rfloor_{-w_F}$.
- [[Correctly Rounded Floating-Point Constant Multiplier]] – compares: same architecture, exact constant multiplier, $0.5$ ulp for roughly twice the constant width.
- [[Floating-Point Multiplier by a Power of Two]] – compares: the degenerate $F_C=0$ case, where the significand path disappears and the error drops to zero.
- [[Constant Multiplier with Subnormal Support]] – extends: adds the saturated normalizer this baseline omits.
- [[Shift-and-Add]] – depends-on: one of the two ways to build the $\times(1+F_C)$ core.
- [[KCM, Table-Based Constant Multiplication]] – depends-on: the other, table-based, way.
- [[Bit Heaps]] – supports: the structure into which the rounding bit is absorbed instead of a post-normalization adder.
- [[Rounding]] – supports: why faithful means $<1$ ulp, and why only two rounding-bit positions can occur.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where this variant sits against every sibling in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 15 "Specialization and Fusion of Floating-Point Operators".
  - §15.1 Floating-Point Constant Multiplication, Fig. 15.1, Eq. (15.1), pp. 453–454 — substitution into the generic multiplier, the unbiased $E_C$ argument, the overflow/flush-to-zero range argument.
  - §15.1.1 Multiplication by a power of two, Fig. 15.2, pp. 454–455 — the $w_E+1$-bit `sfix` tentative exponent and the single sign-bit test.
  - §15.1.2 Baseline Faithful Floating-Point Multiplier by a Constant, Fig. 15.3, Eqs. (15.2)–(15.4), pp. 455–457 — the $[1,4)$ product bound, the $F_{C^{-1}}$ predictor and its two inequalities, the limit case, the rounding-position and area arguments.
- Cross-referenced from within the chapter: Fig. 11.7 (generic FP multiplier) p. 344; Table 11.2 p. 343; §6.3.3 (constant comparison) for the "comparator is no larger than the deleted adder" claim, p. 457; Chap. 12 for the constant significand multiplier itself.
- [DIZ07] Dimitrov, Imbert, Zakaluzny, *ARITH* 2007, pp. 261–268 — multiplication by a constant is sublinear in the constant's size, cited p. 460.
