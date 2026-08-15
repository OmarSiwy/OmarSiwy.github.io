---
title: "Sine-Cosine Octant Reconstruction"
description: "The output-side swap/negate: eight sqo patterns select which of (sin,cos) goes where and with which sign, at the cost of a mux pair and a row of XORs."
kind: circuit
source: "ASA §20.3, pp. 605-606; Fig. 20.11, p. 617; §20.5.4, p. 619"
status: seed
spade: simulated
tags: [digital, cordic, trigonometric, argument-reduction, fpga]
aliases:
  - Octant Reconstruction
  - sqo Reconstruction
  - Swap and Negate
  - Swap-Negate Block
---

# Sine-Cosine Octant Reconstruction

The output half of octant argument reduction: given $\cos\pi Y'$ and $\sin\pi Y'$ on a single octant, it recovers $\cos\pi X$ and $\sin\pi X$ on the whole circle using only a mux pair and two rows of XORs — no adder, and therefore no carry chain.

```tikz title="The eight sqo sectors, and the swap/negate datapath that undoes them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% --- (a) the eight sqo sectors of the unit circle ---
\draw[gray] (-1.6,0) -- (1.6,0);
\draw[gray] (0,-1.6) -- (0,1.6);
\draw[gray,dashed] (-1.13,-1.13) -- (1.13,1.13);
\draw[gray,dashed] (-1.13,1.13) -- (1.13,-1.13);
\draw[thick] (0,0) circle (1.6);
\foreach \a/\l in {22.5/000, 67.5/001, 112.5/010, 157.5/011,
                   202.5/100, 247.5/101, 292.5/110, 337.5/111}
  \node[font=\tiny] at (\a:1.1) {$\l$};
\draw[->,thick,red] (0,0) -- (233.5:1.6);
\node[font=\tiny,red,anchor=north east] at (233.5:1.72) {$\pi X$};
\draw[->,thick,blue] (0,0) -- (8.5:1.6);
\node[font=\tiny,blue,anchor=west] at (8.5:1.66) {$\pi Y'$};
\node[font=\tiny,align=center] at (0,-2.25)
  {$sqo$ = the 3 leading bits of $X$;\\ the kernel only ever sees sector $000$};

% --- (b) the swap/negate datapath ---
\begin{scope}[xshift=5.4cm,yshift=-1.85cm]
\node[font=\small] at (0,3.55) {$C=\cos\pi Y'$};
\node[font=\small] at (3.0,3.55) {$S=\sin\pi Y'$};
\draw[->] (0,3.3) -- (0,2.65);
\draw[->] (3.0,3.3) -- (3.0,2.65);
\node[font=\tiny,left] at (-0.05,2.98) {$-\ell+g$};
\node[font=\tiny,right] at (3.05,2.98) {$-\ell+g$};
\node[draw,minimum width=4.0cm,minimum height=0.6cm] at (1.5,2.35) {swap if $q\oplus o$};
\draw[->] (0,2.05) -- (0,1.35);
\draw[->] (3.0,2.05) -- (3.0,1.35);
\node[draw,minimum width=1.7cm,minimum height=0.6cm] at (0,1.05) {$\oplus\,(s\oplus q)$};
\node[draw,minimum width=1.7cm,minimum height=0.6cm] at (3.0,1.05) {$\oplus\,s$};
\draw[->] (0,0.75) -- (0,0.05);
\draw[->] (3.0,0.75) -- (3.0,0.05);
\node[font=\tiny,left] at (-0.05,0.42) {$-\ell+g+1$};
\node[font=\tiny,right] at (3.05,0.42) {$-\ell+g+1$};
\node[font=\small,below] at (0,0.02) {$\cos\pi X$};
\node[font=\small,below] at (3.0,0.02) {$\sin\pi X$};
\node[font=\tiny,align=center] at (1.5,-0.9)
  {two $(-\ell+g)$-bit muxes and $2(-\ell+g+1)$ XORs, no carry chain;\\
   each complement is $1$ ulp low on the guard-bit datapath};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 20.6, p. 606 (sector map and reconstruction table), with the datapath of the* Swap/negate *box of Fig. 20.11, p. 617*

**Read the three leading bits as three successive turns of the circle.** The argument is a binary angle $X\in[-1,1)$ in $\mathrm{sfix}(0,\ell)$ — two's complement, $-\ell$ fractional bits, see [[Number Formats]] — and the function computed is $\cos\pi X,\ \sin\pi X$, so the period $2\pi$ in radians is the period $2$ in $X$. Naming the leading bits $X_0=s$, $X_{-1}=q$, $X_{-2}=o$ (Fig. 20.5, p. 605) and the remaining $-\ell-3$ bits $Y\in\left[0,\tfrac14\right)$, the two's-complement value is

$$X = -s + \tfrac{q}{2} + \tfrac{o}{4} + Y .$$

The sign bit carries weight $-1$, but $-1\equiv +1 \pmod 2$ and $2$ is exactly the period, so *the sign bit is a half-turn, not a negation of the argument*. Each of $s,q,o$ therefore contributes a fixed rotation — $\pi$, $\pi/2$, $\pi/4$ — and the whole reconstruction is those three rotations applied to the kernel result in sequence.

**A half-turn is a common negation.** With $U=\tfrac q2+\tfrac o4+Y\in[0,1)$ we have $\pi X\equiv \pi U + s\pi$, and the addition formulas (20.14) at $b=\pi$ give $\cos(a+\pi)=-\cos a$, $\sin(a+\pi)=-\sin a$. So $s$ negates both outputs and touches nothing else. This is the cheapest of the three bits and the reason the sign bit is peeled first.

**A quarter-turn swaps and negates exactly one output.** With $V=\tfrac o4+Y\in[0,\tfrac12)$, the same formulas at $b=\pi/2$ give $\cos(a+\tfrac\pi2)=-\sin a$ and $\sin(a+\tfrac\pi2)=\cos a$. The asymmetry is the whole point: $q$ crosses the outputs *and* injects a negation into the cosine path only, which is where the second, distinct XOR control comes from.

**An eighth-turn is a reflection, so it swaps and negates nothing.** This is the only one of the three that is not a rotation. The reduction defines $Y'=\tfrac14-Y$ when $o=1$ (20.21), so $\pi V=\tfrac\pi4+\pi Y=\tfrac\pi2-\pi Y'$, and the complement identities (20.10)–(20.11) give $\cos(\tfrac\pi2-a)=\sin a$, $\sin(\tfrac\pi2-a)=\cos a$. A reflection about the main diagonal is an exchange of coordinates with both signs preserved — which is exactly why the $o=1$ case needs a *subtraction on the input* and buys a *sign-free swap on the output*, and why the two halves of the reduction cannot be collapsed into one.

**Composing the three collapses eight rows to two XOR gates.** Both $q$ and $o$ exchange the two outputs, so exchanging twice is not exchanging at all — the swap control is their parity, $q\oplus o$. Negation likewise composes by XOR of the negating conditions, since $(-1)^a(-1)^b=(-1)^{a\oplus b}$: the sine path is negated by $s$ alone, the cosine path by $s$ and by $q$, hence by $s\oplus q$. Writing $C=\cos\pi Y'$ and $S=\sin\pi Y'$, both non-negative on the octant $\pi Y'\in[0,\tfrac\pi4]$:

> [!note] The reconstruction table is not a table
> Fig. 20.6 prints all eight $sqo$ rows flat, and read that way it looks like a $3\to 2\times(\text{select}+\text{sign})$ decoder. It is not. By associativity of $\oplus$ the eight rows factor into **one swap bit $q\oplus o$ and two negate bits $s\oplus q$ and $s$** — three two-input gates of control logic for the entire circle, computed off the critical path while the kernel is still running. Verify the factorisation against any row of the printed table: for $sqo=110$ the swap bit is $1$ and the cosine negate bit $s\oplus q=0$, giving $\cos\pi X = +S$ and $\sin\pi X=-C$, which is the row.

$$\boxed{\ \begin{aligned}
\cos\pi X &= (-1)^{\,s\oplus q}\cdot\bigl[(q\oplus o)\ ?\ S:C\bigr] \\
\sin\pi X &= (-1)^{\,s}\phantom{{}\oplus q}\cdot\bigl[(q\oplus o)\ ?\ C:S\bigr]
\end{aligned}\ }$$

**The negation is a row of XORs, not an adder.** True two's-complement negation is $-x=\bar x+1$, and that $+1$ is a full-width carry propagation sitting on the output critical path — the single most expensive thing that could be put there, and by far the most expensive thing in this block. Dropping it leaves the bitwise complement alone, $\bar x = -x-2^{\ell-g}$, i.e. the answer is low by exactly one ulp *of the guard-bit datapath*, not of the result. The error analysis of §20.5.4 (p. 619) budgets one ulp for this and for each of the other truncations, and arrives at $g=4$ guard bits independent of $\ell$; the complement shortcut is absorbed with room to spare. The general accounting is in [[Error Accuracy]] and the choice of what to drop is a [[Rounding]] decision, not a logic one.

**Widths.** The kernel emits $C,S$ as *unsigned* words of $-\ell+g$ fractional bits. They are unsigned because the reduction guarantees $\pi Y'\in[0,\tfrac\pi4]$, where both functions are non-negative; and they fit in $[0,1)$ only because of the output scaling $f_{\cos}(x)=(1-2^{\ell})\cos\pi x$ (20.19–20.20), which pulls $\cos 0$ down from the unrepresentable $1$ to the largest representable value. Reconstruction prepends one sign bit — a zero, since the sources are non-negative — giving two's-complement results of $-\ell+g+1$ bits that span $[-1,1)$, and the caller rounds to $\mathrm{sfix}(0,\ell)$ downstream. No width grows anywhere else: a mux does not grow, and by definition neither does a bitwise complement.

> [!warning] Sign-convention error in the printed source
> §20.2.2 (p. 603) writes the format as $\mathrm{sfix}(0,-\ell)$ and the scaling as $(1-2^{-\ell})$, but Fig. 20.4 on the facing page sets $\ell=-3$ and Table 20.2 (p. 618) lists every LSB as $\ell$ or $\ell-g$. Those cannot both hold. The self-consistent reading — the one used here and throughout this vault — is $\ell<0$, LSB weight $2^{\ell}$, $\mathrm{ulp}=2^{\ell}$, and datapath widths counted as $-\ell+g$; under it (20.19)–(20.20) read $(1-2^{\ell})$. Every $\ell$ on this page is that convention, not the one printed in §20.2.2.

**On an FPGA the whole block is one LUT deep.** Bit $i$ of the cosine output is $\bigl[(q\oplus o)\ ?\ S_i:C_i\bigr]\oplus(s\oplus q)$ — a Boolean function of four variables ($C_i$, $S_i$, and the two precomputed control bits), so it fits a single 6-LUT with two inputs to spare, and likewise for the sine output. That is $2(-\ell+g+1)$ LUTs in one logic level for the entire reconstruction, and no carry-chain resource at all: mux and XOR fuse rather than stacking, which is the concrete payoff of the factorisation above. On an ASIC the same expression is a 2:1 mux followed by an XOR, roughly two gate delays. Contrast the alternative that a naive reading of Fig. 20.6 suggests — an eight-way select driven by a $3\to8$ decoder — which is deeper and wider for the same function. See [[Combinational Logic]] for the LUT-mapping argument and [[Boolean Algebra]] for the $\oplus$-associativity step.

**When it breaks.**

- **No guard bits, no shortcut.** The complement-for-negation trick is free only because $g>0$ absorbs the one-ulp deficit. On a datapath that carries exactly $-\ell$ bits, that deficit is a last-bit error in the delivered result and the $+1$ has to be paid — a full carry propagation, which changes the block from one logic level to $O(\log(-\ell))$.
- **Only the octant kernel may feed it.** The formula assumes $C,S\ge 0$, which holds only on $\pi Y'\in[0,\pi/4]$. Feed it a kernel that has not been reduced and the sign-bit prepend is wrong, silently, for half the inputs.
- **The scaling is load-bearing.** Without the $(1-2^{\ell})$ factor, $\cos\pi X$ at $X=0$ is $1$, unrepresentable in $\mathrm{sfix}(0,\ell)$, and rounding up wraps it to $-1$ — a modulo error of $2$, not a rounding error. The reconstruction cannot detect or repair this; it must be prevented upstream.
- **A quadrant-reduced sibling needs a different block.** The generic-polynomial architecture (§20.6, p. 620) reduces only to $Y'\in[0,\tfrac12)$ and computes one function at a time under a $\sin/\overline{\cos}$ control bit; its reconstruction is driven by $s$, $q$ and that bit, and $o$ never appears. Do not reuse this block there.
- **It is only cheap for a fused operator.** Callers that want one of the two functions still pay both muxes, because which physical wire carries the wanted function depends on $q\oplus o$ — the swap cannot be optimised away even when half the output is discarded.

**RTL (Spade).**

```spade
fn octant_reconstruct<#uint W>(
    s: bool, q: bool, o: bool,
    c: uint<W>, sn: uint<W>,
) -> (int<{W + 1}>, int<{W + 1}>) {
    let swap = q != o;
    let cos_src = if swap { sn } else { c };
    let sin_src = if swap { c } else { sn };
    let cu: uint<{W + 1}> = zext(cos_src);
    let su: uint<{W + 1}> = zext(sin_src);
    let cw = cu.as_int();
    let sw = su.as_int();
    (if s != q { ~cw } else { cw },
     if s      { ~sw } else { sw })
}
```

`c` and `sn` are the two kernel wires entering the swap box, `swap` is the mux control, and the two `~` are the XOR rows. `W` is $-\ell+g$: the `zext`/`as_int` pair is the sign-bit prepend drawn as the width change from $-\ell+g$ to $-\ell+g+1$, and it costs nothing because the extended bit is a constant zero. Purely combinational — a `fn`, so the compiler would reject a `reg`; a pipelined operator registers *after* this block, not inside it. The one thing synthesis does differently from the drawing: `~` on `int<W+1>` is arithmetically $-x-1$, not $-x$, which is the deliberate one-ulp shortcut and not a rounding artefact the tools will clean up.

Simulated at `W = 16` against a `$cos`/`$sin` behavioural reference: all eight $sqo$ rows driven at $\pi Y'=9^\circ$ where $C=0.988$ and $S=0.156$ are maximally lopsided, five directed corner angles, and a 3000-vector random sweep — 3013 vectors, zero failures, agreement within $2$ ulp (0.5 from kernel rounding, 1 from the complement). Replacing `q != o` with `q && o` fails 2232 of them, so the asymmetric vectors do discriminate.

**Related Notes**

- [[Octant Argument Reduction]] – depends-on: the input half of the same symmetry; it produces $Y'$ and the $sqo$ bits this block consumes, and it pays the $\tfrac14-Y$ complement that this block's $o$ case assumes.
- [[Unrolled CORDIC]] – supports: the pipeline whose final $C_n,S_n$ this block turns back into a full-circle answer.
- [[Iterative CORDIC]] – supports: same block, instantiated once outside the iteration loop rather than at the end of a pipeline.
- [[Table-and-Multiplier Sine and Cosine]] – supports: an entirely different kernel that terminates in this identical Swap/negate box (Fig. 20.11, p. 617) — evidence the reduction is architecture-independent.
- [[Generic Polynomial Sine Evaluator]] – counter-example: reduces to a quadrant with a $\sin/\overline{\cos}$ bit instead of an octant, so it needs a different reconstruction.
- [[Rounding]] – compares: replacing negation by complement is a rounding-mode choice, traded for the carry chain it deletes.
- [[Boolean Algebra]] – supports: associativity and self-inverseness of $\oplus$ are what collapse the eight printed rows to three gates.
- [[Combinational Logic]] – supports: the mux-plus-XOR-per-bit mapping that puts the whole block in one LUT level.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §20.3 *Argument Reduction*, pp. 605-606 — Fig. 20.5 (the $s,q,o$ bit fields), Eq. (20.21), Fig. 20.6 (sector map and the eight-row reconstruction table).
- §20.1 *Mathematical Background*, pp. 601-602 — the diagonal-symmetry identities (20.10)–(20.11) and the addition formulas (20.14) used above.
- §20.2.1 *Binary Angles*, p. 602 — why the period-$2\pi$ wrap becomes the two's-complement modulo-2 wrap.
- §20.2.2 *Scaled Output*, p. 603 — the output scaling $f_{\sin},f_{\cos}=(1-2^{\ell})\{\sin,\cos\}$, Eqs. (20.19)–(20.20).
- Fig. 20.11, p. 617 — the *Swap/negate* box at the bottom of the table-and-multiplier architecture.
- §20.5.4 *Computing the Number of Guard Bits*, p. 619 — one ulp charged per XOR-based complement, $g=4$.
- §20.6, p. 620 — the quadrant-reduced variant that does not use this block.
