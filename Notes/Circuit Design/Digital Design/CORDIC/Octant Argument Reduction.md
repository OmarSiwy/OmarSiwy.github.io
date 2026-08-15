---
title: Octant Argument Reduction
description: "Peel the sign/quadrant/octant bits off a binary angle and fold the rest into [0,1/4) with one row of XORs, so every sin/cos engine only ever sees an octant."
kind: circuit
source: "ASA §20.3, p. 605; §20.4.4, p. 613"
status: seed
spade: simulated
tags: [digital, cordic, range-reduction, fixed-point, fpga]
aliases:
  - Octant Reduction
  - Binary Angle Argument Reduction
  - sqo Reduction
  - Trigonometric Argument Reduction
---

# Octant Argument Reduction

The front end shared by every fixed-point sine/cosine architecture: it reads the octant index directly off the three leading bits of a binary angle and folds the remainder into $[0,\tfrac14)$, and unlike a general [[Range Reduction]] it needs no multiplier, no table and no carry propagation — only wiring and one row of XORs.

```tikz title="Splitting a binary angle into its sqo octant index and a folded octant angle"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------------- panel (a): the bit field of X, and the fold -------------
\node[anchor=east,font=\small] at (-0.15,0) {$X\ =\ \boldsymbol{.}$};
\draw (0,-0.28) rectangle (0.6,0.28)   node[midway] {$s$};
\draw (0.6,-0.28) rectangle (1.2,0.28) node[midway] {$q$};
\draw (1.2,-0.28) rectangle (1.8,0.28) node[midway] {$o$};
\draw[fill=black!6] (1.8,-0.28) rectangle (6.6,0.28) node[midway] {$Y\in[0,\tfrac14)$};
\draw[<->] (0,0.6) -- (1.8,0.6);
\node[anchor=south,font=\tiny] at (0.9,0.65) {3 bits, weights $-1,\tfrac12,\tfrac14$};
\draw[<->] (1.8,0.6) -- (6.6,0.6);
\node[anchor=south,font=\tiny] at (4.2,0.65) {$-\ell-2$ bits, weights $2^{-3}\dots2^{\ell}$};

% XOR row
\foreach \i in {0,1,2,3,4,5,6,7}{
  \pgfmathsetmacro{\xc}{2.1+0.6*\i}
  \draw (\xc,-1.5) circle (0.17);
  \draw (\xc,-1.67) -- (\xc,-1.33);
  \draw (\xc-0.17,-1.5) -- (\xc+0.17,-1.5);
  \draw (\xc,-0.28) -- (\xc,-1.33);
  \draw (\xc,-1.67) -- (\xc,-2.15);
}
\draw (1.5,-0.28) -- (1.5,-1.5) -- (1.93,-1.5);
\foreach \i in {1,2,3,4,5,6,7}{
  \pgfmathsetmacro{\xa}{1.5+0.6*(\i-1)+0.17}
  \pgfmathsetmacro{\xb}{2.1+0.6*\i-0.17}
  \draw (\xa,-1.5) -- (\xb,-1.5);
}
\fill (1.5,-1.5) circle (1.2pt);
\node[anchor=east,font=\tiny,align=right] at (1.3,-1.0) {one XOR per bit,\\no carry chain};
\node[anchor=east,font=\tiny] at (1.42,-1.82) {$o$};
\draw[fill=black!6] (1.8,-2.7) rectangle (6.6,-2.15) node[midway] {$Y'=\ o\ ?\ \overline{Y}\ :\ Y$};
\node[anchor=east,font=\small] at (1.7,-2.42) {$Y'$};
\node[anchor=north west,font=\tiny,align=left] at (0.0,-2.95)
  {$Y'\in[0,\tfrac14)$, so $\pi Y'\in[0,\tfrac{\pi}{4})$ --- one octant.\\
   $\overline{Y}=\tfrac14-Y-1\,\mathrm{ulp}$; $s,q,o$ pass through to the reconstruction stage.};

% ---------------- panel (b): the eight sqo wedges ------------------------
\begin{scope}[xshift=11.0cm,yshift=-1.1cm]
\draw (0,0) circle (2.15);
\foreach \a in {0,45,...,315}{ \draw[gray] (0,0) -- (\a:2.15); }
\foreach \a/\lab in {22.5/000, 67.5/001, 112.5/010, 157.5/011,
                     202.5/100, 247.5/101, 292.5/110, 337.5/111}
  { \node[font=\tiny] at (\a:1.45) {$\lab$}; }
\draw[->] (-2.6,0) -- (2.6,0) node[right,font=\tiny] {$\cos\pi X$};
\draw[->] (0,-2.6) -- (0,2.6) node[above,font=\tiny] {$\sin\pi X$};
\draw[very thick,->] (0,0) -- (80:2.05);
\draw[very thick,->,black!55] (0,0) -- (10:2.05);
\draw[->,thick,black!55] (76:2.35) arc (76:14:2.35);
\node[font=\tiny,anchor=west] at (45:2.5) {$o{=}1$: reflect about $45^\circ$};
\node[font=\tiny,anchor=north,align=center] at (0,-2.8)
  {wedge index $=(s,q,o)$, every wedge $\tfrac14$ wide};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 20.5, p. 605 and Fig. 20.6(a), p. 606*

**Choose a unit in which the period is a power of two, and the reduction becomes free.** The whole construction rests on the argument being a *binary angle*: the operator computes $\sin(\pi X)$ and $\cos(\pi X)$ with $X\in[-1,1)$ held in $\mathrm{sfix}(0,\ell)$, i.e. one sign bit and $-\ell$ fraction bits, $W=1-\ell$ bits total — see [[Fixed-Point Representations]] for the format and [[Number Formats]] for the two's-complement convention. A radian argument cannot do this, because the period $2\pi$ is irrational and therefore never lands on the fixed-point grid, so every wrap costs a systematic rounding error. With $\pi X$ the modulo-$2\pi$ periodicity of sine collapses onto the modulo-$2$ wrap of two's complement, which is *already what the adder does*. The reduction "$\bmod\ 2\pi$" that dominates a floating-point `sin` implementation costs zero gates here, and an argument with $k$ extra integer bits is reduced by dropping those bits — the reason a DDS phase accumulator can be truncated straight into a sine table.

**Read the octant index off the top three bits, and check that two's complement does not spoil it.** Name the three leading bits of $X$ (Fig. 20.5): $X_0=s$ for *sign*, $X_{-1}=q$ for *quadrant*, $X_{-2}=o$ for *octant*, and let $Y\in[0,\tfrac14)$ be the remaining $-\ell-2$ bits, LSB weight $2^{\ell}$. By the definition of two's complement the sign bit carries weight $-1$, so

$$X = -s + \tfrac{q}{2} + \tfrac{o}{4} + Y .$$

Read the same three bits as an *unsigned* integer $k=(sqo)_2 = 4s+2q+o \in\{0,\dots,7\}$, so that $\tfrac{k}{4} = s + \tfrac{q}{2} + \tfrac{o}{4}$. Substituting gives $X = \tfrac{k}{4} + Y - 2s$, and $2s$ is an integer multiple of the period $2$, hence

$$X \equiv \tfrac{k}{4} + Y \pmod 2 .$$

The angle $\pi X$ therefore lies in wedge number $k$ counted counter-clockwise from $0^\circ$ in steps of $45^\circ$ — which is exactly the labelling of Fig. 20.6(a), and the reason the sign bit needs no special-casing at all. The $-2s$ that two's complement inserts is invisible to a periodic function.

**Fold the octant with a reflection, because that is the one symmetry a $45^\circ$ wedge still has.** Wedge $k$ has been peeled off, leaving $\pi Y\in[0,\tfrac\pi4)$ once $o$ is accounted for — but $o$ is part of $k$, so the residue after removing $k$ is a *half*-wedge only when $o=0$. The book's split instead removes $s,q,o$ and keeps $Y$, then fixes the parity with

$$Y'=\begin{cases}Y & \text{if } o=0\\[2pt] \tfrac14-Y & \text{if } o=1\end{cases}\tag{20.21}$$

so that $Y'\in[0,\tfrac14)$ always. The $o=1$ branch is the symmetry about the main diagonal, identities (20.10)–(20.11),

$$\sin\!\left(\tfrac\pi2-\theta\right)=\cos\theta,\qquad \cos\!\left(\tfrac\pi2-\theta\right)=\sin\theta,$$

applied at $\theta=\pi Y$: reflecting the angle across $45^\circ$ swaps sine and cosine and nothing else. That swap is not free — it is a mux pair — but it is paid once, on the output side, in [[Sine-Cosine Octant Reconstruction]]. Together with the seven sign/swap patterns for the other wedges, this is what reduces a full-circle problem to $\sin(\pi Y')$ and $\cos(\pi Y')$ on a single octant.

**Implement $\tfrac14-Y$ as a bitwise complement, and pay one ulp instead of one carry chain.** Write $Y=\hat Y\cdot 2^{\ell}$ with $\hat Y$ an $n$-bit unsigned integer, $n=-\ell-2$. Then $\tfrac14 = 2^{-2} = 2^{n+\ell} = 2^{n}\cdot 2^{\ell}$, i.e. $\tfrac14$ is *full scale* of the $Y$ field, and the subtraction in integer units is $2^{n}-\hat Y$. The two's-complement identity $-x=\bar x+1$ specialised to $n$ bits gives $2^{n}-\hat Y = \overline{\hat Y}+1$, so

$$\tfrac14 - Y \;=\; \overline{Y} + 2^{\ell},$$

and dropping that $+1$ ulp turns a full $n$-bit subtraction into $n$ independent XOR gates driven by $o$. The saving is a whole carry propagation on a path that sits in front of everything else, and $o$ is the only control signal, so the row is a fanout-$n$ broadcast plus one gate level — constant delay in $n$. On an FPGA the XOR is not even a gate: $o$ becomes one extra input of the LUT that the downstream operator's first level already needs, so the fold is genuinely free in area and delay, whereas a real $\tfrac14-Y$ subtractor would consume $n$ carry-chain cells. On an ASIC standard-cell flow the row is $n$ XOR2 cells and one buffer tree — small, but not nothing, and it is on the critical path in a way the carry chain version would be much more so.

> [!note] The dropped ulp is not merely tolerable, it is load-bearing
> With $o=1$ and $Y=0$ the exact reduction wants $Y'=\tfrac14$ — which is precisely the one value the $n$-bit field cannot hold, since $Y'\in[0,\tfrac14)$ is half-open. The complement returns $\tfrac14-2^{\ell}$, the largest representable value, so the "cheap" version is also the only one that does not overflow. Doing the subtraction exactly would force an extra bit on $Y'$ and therefore on every operator behind it.

**Account for the ulp where the rest of the error budget lives, not locally.** The error is one ulp *of the guard-bit datapath*, not of the result: an architecture that computes just right carries $g$ guard bits and works to precision $2^{\ell-g}$, so this ulp is $2^{-g}$ of a result ulp — see [[Error Accuracy]] for the accounting. The book's verdict is that it "usually does not even change the value of $g$, and hence incurs no architectural overhead" (p. 613); in the table-and-multiplier architecture it is one named line item out of roughly fifteen ulps of rounding loss that together give $g=4$ (p. 619). The same argument licenses the second XOR row, the final negation in the reconstruction stage.

$$\boxed{\ \pi X \equiv \tfrac{\pi}{4}(sqo)_2 + \pi Y \ (\mathrm{mod}\ 2\pi), \qquad Y' = o\,?\,\overline{Y}:Y \;=\; \tfrac14 - Y - 2^{\ell}\big|_{o=1}\ }$$

**When it breaks.**

- **Radian inputs.** Every line above assumes the binary-angle format. Given $\theta$ in radians you are back to a genuine [[Range Reduction]] with a multiplication by $1/\pi$ and its own error analysis, and none of this is free any more.
- **$g=0$.** With no guard bits the two XOR rows contribute one full result ulp each, which alone exceeds the half-ulp budget of a last-bit-accurate operator. The shortcut is only sound *because* a computing-just-right architecture already carries $g\ge 1$; below that, do the subtraction properly.
- **Tiny $-\ell$.** The reduction eats three bits, so for $-\ell\le 3$ the $Y$ field is one bit or less and the whole operator degenerates into a table of a handful of entries — cheaper to tabulate $\sin(\pi X)$ directly than to build a reduce/evaluate/reconstruct pipeline (§20.5.5, p. 620).
- **Diminishing returns past the octant.** Nothing stops you slicing a fourth leading bit, but $\sin$ and $\cos$ have no symmetry finer than the $45^\circ$ diagonal, so a $16$th of the circle needs a *rotation*, not a reflection — that is (20.14) and a real multiplier, which is where [[Table-and-Multiplier Sine and Cosine]] takes over with its second, coarser split of $Y'$.
- **Boundary $X=-1$.** The pattern $100\dots0$ maps to $k=4$, $Y=0$, angle $-\pi$; the modulo-$2$ wrap identifies it with $+\pi$, so it is the same point on the circle and there is no special case — but a testbench that expects $X\in(-1,1)$ open will flag it.

**RTL (Spade).**

```spade
/// Split a binary angle X in sfix(0, l) -- W = 1 - l bits -- into its octant
/// index (s, q, o) and the folded octant angle Y' in [0, 1/4).
fn octant_reduce<#uint W>(x: uint<W>) -> (bool, bool, bool, uint<{W - 3}>) {
    // element 0 of as_bits() is the LSB, so the low slice is Y and the high
    // slice is (o, q, s) read upwards.
    let (ylo, sqo) = x.as_bits().split_at::<{W - 3}>();
    let y = ylo.as_uint();
    // o = 1 folds the octant: ~y is 1/4 - y, one ulp short.
    (sqo[2], sqo[1], sqo[0], if sqo[0] { ~y } else { y })
}
```

`split_at::<{W-3}>()` is the diagram's vertical cut through the bit field: no logic, pure renaming, which is why the three flag bits cost nothing to extract. The `if sqo[0] { ~y } else { y }` is the XOR row — written as a mux, it lowers to `o ^ y[i]` per bit because one arm is the complement of the other, and synthesis will collapse it into the fanin of whatever consumes `Y'` rather than building a separate gate row as the drawing shows. Everything here is combinational; the reduction is normally absorbed into the first pipeline stage of the evaluator behind it. Note the return type `uint<{W-3}>` — the fold is the one operation in a sine datapath that does **not** grow its operand, which is the whole point of using a complement instead of a subtraction.

Compiled and simulated with a 12-bit instance (`W=12`, so $\ell=-11$, $n=9$): 3007 vectors — seven named cases including the asymmetric `101_000000001` ($Y=1\Rightarrow Y'=510$) and `000_100000000` ($Y=256$), which a bit-reversed slice would swap, plus a 3000-vector random sweep against `x[9] ? ~x[8:0] : x[8:0]`.

**Related notes.**

- [[Sine-Cosine Octant Reconstruction]] – extends: consumes the $s,q,o$ this note produces and undoes the fold on the output side with the eight-row swap/negate table.
- [[Range Reduction]] – compares: the general case this is the degenerate, multiplier-free instance of, available only because the period is a power of two.
- [[Fixed-Point Representations]] – depends-on: the two's-complement weighting of the sign bit is what makes $(sqo)_2$ the wedge index.
- [[Fixed-Point Function Approximation]] – supports: the octant-bounded $Y'$ is the input interval every approximation behind this stage is fitted on.
- [[CORDIC Rotation Mode]] – supports: with the argument already inside $\pi/4$, the micro-rotation can start at $i=1$ and the $45^\circ$ stage is dropped (p. 607).
- [[Table-and-Multiplier Sine and Cosine]] – extends: applies a second, coarser split to $Y'$, trading the reflection for a genuine angle-addition formula.
- [[Choosing a CORDIC Architecture]] – compares: this stage is common to all three architectures, so it never enters the comparison between them.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §20.1, p. 601 — the diagonal symmetry, identities (20.10)–(20.11).
  - §20.2.1, p. 602 — binary angles, $\mathrm{sfix}(0,\ell)$ and the modulo-$2$ period.
  - §20.3, p. 605 — the $s,q,o$ split and (20.21); Fig. 20.5, p. 605; Fig. 20.6, p. 606.
  - §20.4.1, p. 607 — why the reduced range lets CORDIC start at $i=1$.
  - §20.4.4, p. 613 — the XOR shortcut and its one-ulp price.
  - §20.5.4, p. 619 — the ulp appearing as a line item in the $g=4$ budget.
  - §20.5.5, p. 620 — small-size special cases.
