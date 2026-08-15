---
title: "Reduced-Z CORDIC Datapath"
description: "|Z_i| < 2^-i, so stage i's angle adder can be one bit narrower than stage i-1's: a triangular instead of rectangular Z datapath, ~1/6 off total area and a shorter d_i path."
kind: circuit
source: "ASA §20.4.5, p. 613"
status: seed
spade: simulated
tags: [digital, cordic, fpga, area, fixed-point]
aliases:
  - Reduced Z Datapath
  - Triangular Z Datapath
  - Reduced Zi Datapath
  - Just-Right CORDIC Angle Datapath
---

# Reduced-Z CORDIC Datapath

An unrolled [[CORDIC Rotation Mode]] operator in which the residual-angle adder of stage $i$ is built one bit narrower than the adder of stage $i-1$, so the $Z$ datapath is a triangle rather than a rectangle.

```tikz title="One reduced-Z CORDIC stage, and the resulting triangular Z datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---------------- C/S datapath, abstracted: it never changes width -------------
\node[anchor=south,font=\small] at (2.05,0.5) {$C_i,\ S_i$};
\draw[->] (1.3,0.45) -- (1.3,-0.3);
\draw[->] (2.8,0.45) -- (2.8,-0.3);
\node[font=\tiny] at (2.05,0.1) {$-\ell+g+1$};
\draw[fill=black!5] (0.0,-0.3) rectangle (4.2,-3.2);
\node[align=center,font=\tiny] at (2.1,-1.75)
  {$C$ and $S$ datapath\\[2pt] two hardwired shifts $\gg i$\\ + two add/sub of\\ $-\ell+g+1$ bits\\[3pt] \emph{same width at every $i$}};
\draw[->] (1.3,-3.2) -- (1.3,-3.85);
\draw[->] (2.8,-3.2) -- (2.8,-3.85);
\node[anchor=north,font=\small] at (2.05,-3.85) {$C_{i+1},\ S_{i+1}$};

% ---------------- Z datapath, one stage, drawn to scale in bit cells ----------
% cell width 0.45; Z_i is 10 cells (5.9..10.4), everything after it is 9 cells
\draw[fill=black!15] (5.9,-0.15) rectangle (6.35,0.25);
\draw (5.9,-0.15) rectangle (10.4,0.25);
\foreach \x in {6.35,6.8,7.25,7.7,8.15,8.6,9.05,9.5,9.95} \draw[black!35] (\x,-0.15) -- (\x,0.25);
\node[anchor=south,font=\small] at (8.15,0.3) {$Z_i$};
\node[anchor=west,font=\tiny] at (11.75,0.05) {$-\ell+g-i+1$ bits, MSB weight $2^{-i}$};

% sign bit tap -> d_i
\draw[->] (6.125,-0.15) -- (6.125,-0.62) -- (5.05,-0.62);
\draw[fill=white] (4.45,-0.82) rectangle (5.05,-0.42);
\node[font=\tiny] at (4.75,-0.62) {$d_i$};
\draw[->] (4.45,-0.62) -- (4.2,-0.62);
\draw[->] (4.75,-0.82) -- (4.75,-2.05) -- (6.35,-2.05);
\node[font=\tiny,align=center] at (5.6,-1.3) {sign bit,\\no comparator};

% arctan constant
\draw[fill=black!5] (6.35,-1.35) rectangle (10.4,-0.95);
\node[font=\tiny] at (8.4,-1.15) {$A_i=\arctan(2^{-i})/\pi$};
\node[anchor=west,font=\tiny] at (11.75,-1.15) {$-\ell+g-i$ bits, correctly rounded};
\draw[->] (7.0,-1.35) -- (7.0,-1.8);

% low bits of Z_i routed round the right
\draw[->] (10.4,0.05) -- (11.35,0.05) -- (11.35,-2.05) -- (10.4,-2.05);

% the narrow add/sub
\draw[fill=white] (6.35,-2.3) rectangle (10.4,-1.8);
\node[font=\tiny] at (8.4,-2.05) {add/sub};
\node[anchor=west,font=\tiny] at (11.75,-2.05) {$-\ell+g-i$ bits: one narrower than $Z_i$};
\draw[->] (8.375,-2.3) -- (8.375,-2.8);

% Z_{i+1}
\draw (6.35,-3.2) rectangle (10.4,-2.8);
\foreach \x in {6.8,7.25,7.7,8.15,8.6,9.05,9.5,9.95} \draw[black!35] (\x,-3.2) -- (\x,-2.8);
\draw[dashed,black!55] (5.9,-3.2) rectangle (6.35,-2.8);
\node[font=\tiny,black!55] at (6.125,-3.0) {$\times$};
\node[anchor=north,font=\small] at (8.375,-3.3) {$Z_{i+1}$};
\node[anchor=west,font=\tiny,align=left] at (11.75,-3.0)
  {no carry-out kept: $|Z_{i+1}|<2^{-i}$\\ is a theorem, not a hope};

% ---------------- the triangle ------------------------------------------------
\draw[black!30] (-0.6,-4.45) -- (13.0,-4.45);
\node[anchor=south,font=\tiny] at (3.05,-4.95) {$C$ and $S$: rectangular};
\node[anchor=south,font=\tiny] at (8.35,-4.95) {$Z$: triangular};
\foreach \i/\y/\l in {1/-5.3/6.35, 2/-5.7/6.8, 3/-6.1/7.25, 4/-6.5/7.7, 5/-6.9/8.15} {
  \draw[fill=black!5] (0.8,\y-0.15) rectangle (5.3,\y+0.15);
  \draw[fill=black!20] (\l,\y-0.15) rectangle (10.4,\y+0.15);
  \node[anchor=east,font=\tiny] at (0.7,\y) {$i=\i$};
}
\node[anchor=north,font=\tiny] at (2.6,-7.2) {$2n(-\ell+g+1)$ full-adders};
\node[anchor=north,font=\tiny,align=center] at (8.8,-7.2)
  {$\sum_{i=1}^{n}(-\ell+g-i)\approx\tfrac12(-\ell+g)^2$ full-adders,\\ against $n(-\ell+g+1)$ for a rectangular $Z$:\\ half of one datapath out of three, hence $\approx1/6$ of the operator};
\end{circuitikz}
\end{document}
```

*stage skeleton after Fig. 20.8, p. 608; the bit-cell widths and the triangle are my own construction, from the argument of §20.4.5, p. 613*

**Turn the convergence proof into a width bound.** The rotation-mode recurrence drives the residual angle to zero, $Z_{i+1}=Z_i-d_i\alpha_i$ with $\alpha_i=\arctan(2^{-i})/\pi$ (the $/\pi$ because $Z$ is a *binary* angle — see [[Octant Argument Reduction]]). Convergence holds precisely because each term is dominated by its own tail, $\alpha_i\le\sum_{j>i}\alpha_j$, and a greedy sign choice therefore leaves a residual trapped in the tail:

$$|Z_{i+1}|\ \le\ \sum_{j>i}\alpha_j\ =:\ T_{i+1}$$

That inequality is usually read as "the algorithm terminates". Read it instead as a statement about *bits*. Since $\arctan x<x$, the geometric series $\sum_{j\ge i}2^{-j}=2^{-i+1}$ bounds the tail from above, so $T_i<2^{-i+1}/\pi=0.6366\cdot 2^{-i}$, and in particular

$$|Z_i|\ <\ 2^{-i}$$

**So the MSB of $Z_i$ is $-i$, and one leading bit dies per iteration.** With the internal datapath's LSB at $2^{\ell-g}$ ($\ell$ the output LSB, $g$ the guard bits fixed by the [[Error Accuracy]] budget), a two's-complement field whose sign bit carries weight $2^{-i}$ and whose LSB is $2^{\ell-g}$ is

$$w_i\ =\ (-i)-(\ell-g)+1\ =\ -\ell+g-i+1\ \text{bits}$$

against the constant $-\ell+g+1$ bits that $C_i$ and $S_i$ need — those stay full width because $|C_i|,|S_i|$ are bounded by $1$ and never shrink. Stage $1$ already starts one bit short of the vector datapath, and every stage after that sheds another.

**Only the low $w_i-1$ bits ever reach an adder.** Two's-complement addition is arithmetic modulo $2^k$ for whatever $k$ you keep ([[Number Formats]]), so truncating both $Z_i$ and the constant $A_i$ to their low $w_i-1=w_{i+1}$ bits and adding modulo $2^{w_{i+1}}$ returns the mathematically exact $Z_{i+1}$ *whenever $Z_{i+1}$ is representable in $w_{i+1}$ bits* — which is exactly the bound just proved. The discarded slice is not an approximation and not a truncation error: the full-adder cell at that position would compute a bit whose value is already determined. Stage $i$'s [[Adders|add/sub]] is therefore $-\ell+g-i$ bits wide, one narrower than the register feeding it.

**The sign decision stays free.** $d_i=+1$ iff $Z_i\ge0$, and in two's complement that is the complement of the MSB — one wire. Nothing scans the word, so no priority encoder and no [[Leading Zero Counters]] hardware appears; the narrowing is a synthesis-time constant, decided by the proof rather than measured at run time.

> [!important] The datapath is sized by a theorem
> Everything else in a *computing just right* CORDIC — $n=-\ell+2$, $g=2+\lfloor\log_2\bar\delta_\text{round}\rfloor$ — comes from an error budget, and a wrong bound costs accuracy. This one comes from the convergence proof, and a wrong bound costs *correctness*: shave one bit too many and $Z$ wraps, $d_i$ flips, and the rotation walks off in the wrong direction. The margin is the constant $2/\pi\approx0.637$ between $T_i$ and $2^{-i}$, and it does not depend on $\ell$, $g$ or $n$.

**Sum the triangle instead of the rectangle.** Over $n=-\ell+2$ stages the $Z$ full-adder count is

$$\sum_{i=1}^{n}(-\ell+g-i)\ =\ n(-\ell+g)-\frac{n(n+1)}{2}\ \approx\ \frac12(-\ell+g)^2$$

against $n(-\ell+g+1)\approx(-\ell+g)^2$ for a rectangular $Z$: the angle path almost exactly halves. Since $Z$ is one of three otherwise-equal datapaths, total area falls by about $1/6$. On FPGAs each bit of the $C$ and $S$ recurrences packs into **one LUT plus one carry-chain bit** ([[Lookup-Tables]]), so the count is unusually predictable:

$$\text{LUTs}\ \approx\ \underbrace{2(-\ell+g)(-\ell+2)}_{C\ \text{and}\ S}+\underbrace{\tfrac12(-\ell+g)^2}_{\text{triangular }Z}\ \approx\ 2.5\,(-\ell+g)^2$$

On ASIC the same triangle removes full-adder cells, and — a consequence the book does not spell out — it also shrinks the *pipeline registers* of an unrolled implementation, since stage $i$ only has to latch $w_i$ bits of $Z$. In a heavily pipelined design that register saving is the larger of the two.

**The shorter adder also shortens the loop.** The loop-carried dependency of the whole operator is $Z_i\to d_i\to Z_{i+1}$, and $d_i$ is the *sign* bit of $Z_i$ — the MSB, hence the last bit to emerge from stage $i-1$'s carry chain. Shortening that chain by one bit per stage makes $d_i$ available earlier, and once $d_i$ is known the shifts and add/subs of $C_{i+1},S_{i+1}$ can start before iteration $i$ has finished, letting two successive carry propagations overlap. The gain shrinks in later iterations, which is unfortunate, because those are exactly the stages where $d_i$ was fastest anyway.

> [!warning] No delay figure exists for this
> The source states the critical-path gain only "in principle" and gives no measured number, because it is not something RTL expresses: nothing in the code says "start stage $i+1$'s carry chain early". Whether the overlap happens is a placement-and-retiming outcome of the synthesis tool. The $\approx1/6$ area figure is quantified; the delay figure is not.

$$\boxed{\ w_i=-\ell+g-i+1\quad\Longrightarrow\quad \sum_{i=1}^{n}(w_i-1)\approx\tfrac12(-\ell+g)^2\ \text{full-adders, }\approx1/6\text{ off the operator}\ }$$

## When it breaks

- **Folded implementations get nothing.** An [[Iterative CORDIC]] has one physical $Z$ adder reused by every iteration, so it must be sized for $i=1$; the triangle collapses back into its bounding rectangle. The optimization exists only in an [[Unrolled CORDIC]], where stage $i$ is distinct silicon.
- **Vectoring mode inverts it.** There the decision comes from the sign of $Y_i$, which is what is driven to zero, while $Z$ *accumulates* the angle from $0$ and must stay full width to the end. The triangle moves to the $Y$ path; applying it to $Z$ overflows immediately.
- **Rounding eats into the margin, but not much.** The bound $|Z_i|<2^{-i}$ is exact arithmetic; the implemented $A_i$ are rounded constants, and the $Z$ error accumulates to at most $i\cdot u/2$ with $u=2^{\ell-g}$. The headroom is a constant factor $1-2/\pi\approx0.36$ of the field, i.e. $0.36\cdot2^{-i}$, which is $0.36\cdot2^{g-\ell-i}$ ulps — vastly more than $n u/2$ for any realistic $n$. Shave the *actual* bound $T_i$ rather than $2^{-i}$ and that cushion is gone.
- **The last stages are noise.** At $i=n=-\ell+2$ the $Z$ adder is only $g-1$ bits. Below a couple of bits the $Z$ path contributes nothing to area or delay and the $C/S$ path is the entire cost — which is also the point at which [[Reduced-Iteration CORDIC]] stops iterating altogether.
- **Asymptotics.** The whole operator is $\Theta((-\ell+g)^2)$ in area and $\Theta(-\ell)$ in depth with or without this optimization. It is a constant-factor win on area and a constant-factor win on delay; it never changes which architecture you should pick.

## RTL (Spade)

```spade
/// One stage of the reduced-Z CORDIC angle datapath.
/// W is the width of Z_i; the stage emits W-1 bits, and its adder is W-1 wide.
entity z_stage<#uint W>(z: int<W>, a: int<{W - 1}>) -> (int<{W - 1}>, bool) {
    let d = !z.sign_bit();
    let zl: int<{W - 1}> = trunc(z);
    let zn = if d { zl -. a } else { zl +. a };
    (zn, d)
}
```

`z` is the $Z_i$ bus, `a` the pre-rounded constant $A_i$, `zn` the $Z_{i+1}$ bus and `d` the $d_i$ wire that leaves for the $C/S$ datapath. `z.sign_bit()` is the shaded MSB cell in the diagram — a wire, no logic. `trunc(z)` drops that cell before the adder, which is why `-.`/`+.` (the *wrapping* $W-1$-bit forms, not the widening `-`/`+`) are the right operators: the carry-out is provably redundant, so discarding it is exact, not a truncation. An unrolled operator instantiates `z_stage::<{W}>` once per $i$ with $W$ decreasing by one each time — the type parameter *is* the triangle. Synthesis will do one thing the drawing does not: fold the constant `a` into the carry chain's LUT initialisation, so on an FPGA the "constant" box costs zero.

Verified by simulation against a behavioural reference at $\ell-g=-12$, $i=2$ (`W = 11`, $A_2=\lfloor 2^{12}\alpha_2\rceil=319$, $|Z_2|\le\lfloor 2^{12}T_2\rfloor=644$): **6767 vectors, 0 failures**, comprising ten named vectors (including the asymmetric pairs $(z,a)=(128,1)\mapsto127$ and $(1,128)\mapsto-127$, and both extremes $z=\pm644\mapsto\pm325=\pm\lfloor2^{12}T_3\rfloor$), a 3000-vector random sweep at the real $A_2$, and a 6000-vector sweep over random constants restricted to invariant-respecting inputs. The reference sign-extends the $W-1$-bit result and compares it to the full-precision $z\mp a$, so it fails if the discarded MSB was ever load-bearing.

## Related Notes

- [[Unrolled CORDIC]] – depends-on: the optimization only exists where stage $i$ is distinct hardware that can be given its own width.
- [[Iterative CORDIC]] – counter-example: one shared adder must be sized for $i=1$, so the triangle collapses back to a rectangle.
- [[CORDIC Rotation Mode]] – supports: supplies the convergence bound $|Z_{i+1}|\le\sum_{j>i}\alpha_j$ that licenses dropping the MSB.
- [[Reduced-Iteration CORDIC]] – extends: truncates the same triangle at $i=\lfloor-\ell/2\rfloor+1$ and finishes the rotation with two small multipliers.
- [[Octant Argument Reduction]] – depends-on: fixes $|Z_1|\le1/4$ and makes $Z$ a binary angle, which is what puts the MSB of $Z_1$ at $-1$.
- [[Lookup-Tables]] – supports: the one-LUT-plus-carry-bit packing of the $C,S$ lines is what makes the $2.5(-\ell+g)^2$ estimate near-exact.
- [[Adders]] – depends-on: each row of the triangle is one carry-propagate add/sub, so the row's delay is whichever adder the tool infers.
- [[Leading Zero Counters]] – compares: the same "how many leading bits are known?" question, answered at run time in hardware instead of once at synthesis time by a proof.
- [[Choosing a CORDIC Architecture]] – compares: where a constant-factor $1/6$ buys you anything against the table-and-multiplier alternatives.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §20.4.5 "Reduced $Z_i$ Datapath", p. 613 — the MSB-of-$Z_i$-is-$-i$ argument, the $\approx1/6$ area figure, the $2.5(-\ell+g)^2$ LUT count, and the critical-path remark.
- Ibid. §20.4.1, pp. 607-609 — the recurrence (20.26)-(20.27), the convergence bound, and Fig. 20.8 (abstract architecture of one iteration, p. 608).
- Ibid. §20.4.3-20.4.4, pp. 610-612 — $n=-\ell+2$, the guard-bit recurrence (20.39) and $g=2+\lfloor\log_2\bar\delta_\text{round}\rfloor$ (20.42), which fix $\ell$ and $g$ in the width formula.
- Ibid. §20.4.6, p. 614 — where the triangle is cut short by a multiplier.
