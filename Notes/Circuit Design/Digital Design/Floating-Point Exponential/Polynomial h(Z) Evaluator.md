---
title: Polynomial h(Z) Evaluator
description: "Replaces the h box with a generic piecewise-polynomial evaluator on [0,1] — k and the degree d become two independent knobs instead of one, which is what carries the architecture to double precision (k=9, d=2, 512 intervals)."
kind: circuit
source: "ASA §22.5.3, pp. 660-661"
status: seed
spade: simulated
tags: [digital, floating-point-exponential, polynomial, horner, fpga]
aliases:
  - Polynomial h Box
  - Polynomial Approximation for Large Precisions
---

# Polynomial h(Z) Evaluator

The $h$ box of the [[Higher-Order e^Y Evaluator]] built as a generic piecewise-polynomial approximator rather than a ROM, which turns the single sizing knob $k$ into the pair $(k,d)$ and is the only variant in Chapter 22 that reaches double precision.

```tikz title="Interior of the h(Z) box: segment-address split, coefficient ROM, degree-2 Horner chain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % input
  \draw[->] (0,10.2) -- (0,9.3);
  \node[anchor=west] at (0.1,9.9) {$Z_{\mathrm{trunc}}$\quad\texttt{ufix}$(-k-1,\,p)$};
  \draw (-2.9,9.3) -- (3.1,9.3);

  % address branch
  \draw[->] (-2.9,9.3) -- (-2.9,7.9);
  \node[anchor=east] at (-2.95,8.8) {$\alpha$ MSBs};
  % offset branch
  \draw (3.1,9.3) -- (3.1,3.45);
  \node[anchor=west] at (3.15,8.8) {$\xi$\quad\texttt{ufix}$(-k-1-\alpha,\,p)$};

  % coefficient ROM
  \draw (-4.6,6.9) rectangle (-1.2,7.9);
  \node at (-2.9,7.55) {coefficient ROM};
  \node at (-2.9,7.2) {$2^{\alpha}\times(C_0,C_1,C_2)$};

  % coefficient wires: C2 innermost (used first), C0 outermost
  \draw (-1.9,6.9) -- (-1.9,5.85) -- (-0.6,5.85);
  \node[anchor=south east] at (-1.85,5.88) {$C_2$};
  \draw (-2.9,6.9) -- (-2.9,4.65) -- (-0.6,4.65);
  \node[anchor=south east] at (-2.85,4.68) {$C_1$};
  \draw (-3.9,6.9) -- (-3.9,2.25) -- (-0.6,2.25);
  \node[anchor=south east] at (-3.85,2.28) {$C_0$};

  % Horner chain, degree d = 2
  \draw (-0.6,5.5) rectangle (1.8,6.2);
  \node at (0.6,5.85) {$\times$};
  \draw (3.1,5.85) -- (1.8,5.85);
  \draw[->] (0.6,5.5) -- (0.6,5.0);

  \draw (-0.6,4.3) rectangle (1.8,5.0);
  \node at (0.6,4.65) {$+$};
  \draw[->] (0.6,4.3) -- (0.6,3.8);

  \draw (-0.6,3.1) rectangle (1.8,3.8);
  \node at (0.6,3.45) {$\times$};
  \draw (3.1,3.45) -- (1.8,3.45);
  \draw[->] (0.6,3.1) -- (0.6,2.6);

  \draw (-0.6,1.9) rectangle (1.8,2.6);
  \node at (0.6,2.25) {$+$};
  \draw[->] (0.6,1.9) -- (0.6,1.1);

  \node[anchor=west] at (2.0,1.5) {$H\approx h(Z)$};
  \node[anchor=west] at (2.0,1.1) {\texttt{ufix}$(-2k-1,\,\ell-g')$};

  % bracket naming the replaced box
  \draw[dashed] (-5.0,0.7) rectangle (5.7,8.3);
  \node[anchor=west] at (-4.95,1.05) {$h(Z)=e^{Z}-Z-1$, degree $d=2$};
\end{circuitikz}
\end{document}
```

*Own construction: the inside of the box drawn as a single rectangle in Fig. 22.6, p. 657, opened up at $d=2$. The dashed boundary is exactly the interface the surrounding architecture already fixes.*

**Normalise the argument onto $[0,1]$ before anything else.** The generic evaluator of [[Polynomial Approximation]] is specified for functions $[0,1]\to[0,1]$, and $Z$ lives on $[0,2^{-k})$ by (22.21). Substituting $Z = 2^{-k}x$ — a pure change of variable, and on a fixed-point bus a *relabelling of exponents*, not a shift — the definition $h(Z)=e^Z-Z-1$ of (22.24) becomes

$$h(x) = e^{2^{-k}x} - 2^{-k}x - 1,\qquad x\in[0,1]$$

which is the function the book hands to the black box (p. 660). No hardware implements the substitution: the $\alpha$ MSBs of $Z_{\mathrm{trunc}}$ are the $\alpha$ MSBs of $x$, because $2^{-k}$ is a power of two.

**Read the evaluator's two ports off the enclosing diagram.** Both formats are already pinned by the [[Higher-Order e^Y Evaluator]] and neither is a free choice here. The input is $Z_{\mathrm{trunc}}$ in `ufix`$(-k-1,\,p)$ with $p=\ell-g'+k-1$, so it is $-2k-\ell+g'+1$ bits wide; the output is $H$ in `ufix`$(-2k-1,\,\ell-g')$, $-2k-\ell+g'$ bits wide. At double precision with $w_F=52$, $g=4$, $g'=0$ — hence $\ell=-56$ — and $k=9$: $p=-48$, so the evaluator is a **39-bit-in, 38-bit-out faithful function unit**. The same formulas reproduce the book's single-precision numbers exactly ($k=10$, $\ell=-27$ gives an $e^A$ table of $2^{10}\times 28$ bits and a truncated $T$ of 18 bits, p. 661), which is the check that they are being read correctly.

**Split the domain rather than raising the degree.** Uniform piecewise splitting cuts $[0,1]$ into $2^\alpha$ subintervals, takes the top $\alpha$ bits of $x$ as a ROM address, and evaluates a per-segment minimax polynomial ([[Remez Minimax]]) in the remaining low bits $\xi$ by [[Horner Evaluation]]. That is the whole mechanism: $\alpha$ address bits buy segments, $d$ buys degree, and the ROM stores $2^\alpha(d+1)$ coefficients. Horner is the right nesting because it needs exactly $d$ multiplications and $d$ additions with a critical path of $d$ multiply-add stages, and each of its intermediate results is a *value*, not a monomial, so every product can be truncated back to the working format instead of grown ([[Multipliers]]).

**The degree can be as low as 2 because the substitution flattens the function.** Differentiating $h(x)=e^{2^{-k}x}-2^{-k}x-1$ term by term, the linear term dies at the second derivative and every further derivative carries one more factor of the chain-rule constant:

$$h^{(n)}(x) = 2^{-kn}e^{2^{-k}x}\quad (n\ge 2),\qquad\text{so}\qquad \max_{[0,1]}\bigl|h^{(d+1)}\bigr| \le 2^{-k(d+1)}e^{2^{-k}}$$

Feeding that into the standard Chebyshev bound for the degree-$d$ minimax error on an interval of length $L=2^{-\alpha}$, namely $\max|f^{(d+1)}|\,(L/2)^{d+1}/\bigl(2^{d}(d+1)!\bigr)$, gives the approximation error of the whole piecewise scheme:

$$\bar\delta_{\mathrm{approx}} \;\lesssim\; \frac{2^{-(k+\alpha)(d+1)}}{2^{2d+1}\,(d+1)!}$$

> [!important]
> $k$ and $\alpha$ enter that exponent **symmetrically**. One more bit of $k$ shrinks the polynomial's job by exactly as much as one more segment-address bit — which is why the outer range reduction and the inner piecewise splitting are genuinely the same kind of trade, and why the operator has a two-dimensional design space rather than a chain of forced choices.

**The book's double-precision pair survives that bound with one bit to spare.** The generator's approximation-error share is about a quarter of an output ulp, $2^{\ell-2}=2^{-58}$. With $k=9$, $d=2$: $\alpha=9$ gives $2^{-54}/192 \approx 2^{-61.6}$, comfortably under; $\alpha=8$ gives $2^{-58.6}$, sitting on the line. So $2^9=512$ intervals is the smallest safe power of two, exactly the count the book reports (p. 661). This confirms sufficiency, not optimality — the actual $\alpha$ is picked by the ILP-driven search of [[Polynomial Approximation]], which also weighs coefficient widths.

> [!warning] Not covered in the source — needs outside research
> §22.5.3 is one page and gives $(k,d,2^\alpha)=(9,2,512)$ with no derivation, no coefficient widths, no multiplier shapes, and no LUT/DSP/BRAM/delay figures. The bound above is derived here from the book's own $h$ and the standard minimax estimate; the coefficient sizing belongs to Chapter 18 and is not restated in Chapter 22. Do not attribute any area number in this note's neighbourhood to Chapter 22 — it has none.

**Two knobs, and they cut in opposite directions.** $k$ sets the *outer* memory-versus-multiplier split: the $e^A$ table is $2^k$ entries of $-\ell+g'+1$ bits, while $F=Z+H$ and the truncated $T_{\mathrm{trunc}}$ are both about $\ell+k$ bits wide, so the near-square outer multiplier *shrinks* as the table grows. At double precision, $k=9$ means a $2^9\times 57$-bit $e^A$ table (~29 Kbit) against a roughly $48\times48$ outer multiplier. $d$ sets the *inner* split, inside the dashed box: raising $d$ by one lets $\alpha$ drop by roughly $\alpha/(d+1)$ bits — dividing the coefficient ROM by a large factor — at the price of one more multiplier and one more Horner stage of latency. The two are not fully independent (changing $k$ moves the port widths the polynomial must hit) but they are two dimensions, and that is the entire content of the section.

**Degree zero recovers the previous architecture.** A degree-0 piecewise polynomial *is* a lookup table: the Horner chain collapses to $H=C_0$ and the coefficient ROM becomes the $2^{|p|-k}$-entry $h$ table of the [[Higher-Order e^Y Evaluator]]. The polynomial variant is therefore not a different circuit but a generalisation along one axis, and the single-precision case study — a $2^8\times 6$-bit $h$ table sharing one BRAM with $e^A$ — is its $d=0$ instance.

**Going generic costs accuracy, and the budget has to absorb it.** A tabulated $h$ can be stored correctly rounded, contributing $\delta_H = 1.65u/2 = 0.825u$; the generic evaluator only promises *faithful*, so $\delta_H = 1.65u$ (p. 659). The extra $0.825u$ has to come from somewhere, and the book takes it out of $\delta_{\mathrm{trunc}T}$ by tightening the $e^A$ truncation to $t=k-1$, which halves that term from $1.25u$ to $0.625u$. The two settlements land within $0.2u$ of each other, $4.7u$ tabulated versus $4.9u$ faithful, so **$g=4$ either way** — the polynomial buys its area saving without moving the guard-bit count. See [[Error Accuracy]] for the ulp conventions.

**On FPGAs the shape is unchanged, which is the point.** The evaluator is still tables plus multipliers, so the coefficient ROM maps to block memory and the Horner multipliers to DSP blocks, exactly like the $h$ table and the outer multiplier they replace ([[FPGAs]]). The three free-accuracy tricks of §22.5.4 still apply unmodified: widen the ROM output to the memory's native width, relax $t$ while $T_{\mathrm{trunc}}$ still fits one DSP input, and round-to-nearest any product that fits a single DSP exactly. [[FloPoCo]]'s `FPExp` chooses $k$ and $d$ by default and exposes both in expert mode; the sized VHDL comes out of the `FixFunctionByPiecewisePoly` flow of [[Fixed-Point Function Approximation]].

$$\boxed{\ h(x)=e^{2^{-k}x}-2^{-k}x-1 \ \text{ on } [0,1],\qquad \bar\delta_{\mathrm{approx}}\lesssim\frac{2^{-(k+\alpha)(d+1)}}{2^{2d+1}(d+1)!},\qquad \text{double: } k=9,\ d=2,\ 2^\alpha=512\ }$$

## When it breaks

- **$d=0$ is not a win.** It is the tabulated-$h$ architecture with a generator wrapped round it, plus the faithful-instead-of-correctly-rounded penalty. Below single precision the $h$ table is already tiny — $2^8\times6$ bits, 1.5 Kbit, free inside a BRAM that the $e^A$ table has to allocate anyway — and no coefficient ROM plus Horner chain beats free.
- **It does nothing for the $e^A$ table.** $2^k$ entries of $\approx w_F+g$ bits still grows exponentially in $k$, and the polynomial only relieves the $h$ side. Past double precision the $e^A$ table is the wall, and the answer is [[Iterative Table-Based Exponential]], not a higher $d$.
- **The flatness argument is specific to $h$.** It works because $h^{(n)}=2^{-kn}e^{2^{-k}x}$; a function whose derivatives do not shrink with $k$ gets none of this, and $\alpha$ grows back to the generic $\approx(\text{output bits})/(d+1)$.
- **The bound above is asymptotic in the segment count.** At small $\alpha$ the Chebyshev estimate is loose, and the real generator measures the error on extremal subintervals instead of trusting it.
- **Faithful only.** Nothing in this path is correctly rounded, so it cannot be used where the [[Direct Tabulation Exponential]] guarantee is required.

## RTL (Spade)

One segment of the degree-2 chain. The coefficient ROM is the block memory in front of it; what is interesting arithmetically is the Horner nesting and the rescaling of each product.

```spade
// One segment of the degree-2 piecewise evaluator for h.
// xi: in-segment offset, 12 fractional bits, unsigned (0 <= xi < 1).
// c2,c1,c0: minimax coefficients for this segment.
// ponytail: one shared 18-bit coefficient format; the real generator sizes
// c2 far narrower than c0, which is where most of the ROM saving lives.
fn horner2(xi: uint<12>, c2: int<18>, c1: int<18>, c0: int<18>) -> int<18> {
    let x: int<18> = sext(xi.to_int());
    let p2: int<36> = c2 * x;
    let a1: int<18> = trunc((p2 >>> 12) + sext::<18, 36>(c1));
    let p1: int<36> = a1 * x;
    trunc((p1 >>> 12) + sext::<18, 36>(c0))
}
```

`xi` is the $\xi$ bus on the right of the diagram, `c2/c1/c0` the three ROM outputs on the left, and the return value is $H$. `to_int` widens the unsigned offset to `int<13>` value-preservingly before `sext` puts it in the signed coefficient format — the offset is unsigned but the coefficients alternate sign, so the multiplier must be signed. Each `*` doubles the width to 36 bits; `>>> 12` undoes the 12 fractional bits of `xi` and `trunc` drops the product back to the working format, which is the truncated multiplier of [[Multipliers]] drawn as a plain $\times$ box. Purely combinational as written: synthesis will pipeline it into $d$ multiply-add stages and absorb both `>>>` into DSP output routing, since a constant shift is free wiring.

Verified with `spade 0.19.0` and simulated against a behavioural Verilog reference: 8 named vectors — including `xi=3, (c2,c1,c0)=(-5,9,-17)` and the same triple reversed, which a swapped Horner association fails — plus a 5000-vector random sweep over all four inputs, 5008/5008 matching.

## Related Notes

- [[Higher-Order e^Y Evaluator]] – extends: this is that circuit's $h$ box opened into a piecewise evaluator; $d=0$ collapses back to it exactly.
- [[Polynomial Approximation]] – depends-on: supplies the black box, the uniform splitting, and the $\alpha$/$d$ search that picks 512 segments.
- [[Horner Evaluation]] – depends-on: the nesting inside the dashed box, and the reason each product can be truncated rather than grown.
- [[Remez Minimax]] – depends-on: computes the per-segment coefficients whose ROM the diagram shows.
- [[Table-Based Function Evaluation]] – compares: the $d=0$ end of the same axis, where a plain table wins outright.
- [[First-Order e^Y Evaluator]] – counter-example: the opposite extreme, dropping $h$ altogether, which forces $k\approx(w_F+4)/2$ and dies at single precision.
- [[Iterative Table-Based Exponential]] – compares: the other route past the $2^k$ table wall, trading latency instead of degree.
- [[Choosing an Exponential Architecture]] – compares: where this variant sits against every sibling in the chapter.
- [[FloPoCo]] – supports: `FPExp` picks $k$ and $d$ by default and exposes both in expert mode.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 22 "Floating-Point Exponential":

- §22.5.1 Large tables and square multipliers — pp. 655–659 (Fig. 22.6, p. 657; formats, and $\delta_H$ / $\delta_{\mathrm{trunc}T}$ in 22.29)
- §22.5.2 First-order architecture — pp. 659–660 (the $k=14$ table wall at single precision)
- §22.5.3 Polynomial approximation for large precisions — pp. 660–661 (the whole section; $h(x)=e^{2^{-k}x}-2^{-k}x-1$, and $k=9$, $d=2$, 512 intervals)
- §22.5.4 FPGA-specific remarks — p. 661 (free-accuracy tricks and the single-precision case study)

Chapter 18 supplies the piecewise evaluator itself and the coefficient sizing; it is invoked by reference on p. 660 and not restated.
