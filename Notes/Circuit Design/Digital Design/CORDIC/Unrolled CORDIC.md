---
title: Unrolled CORDIC
description: "n = -l+2 hardwired stages: shifts become routing, arctan constants become literals, and the whole operator is ~2.5(-l+g)^2 LUTs with zero DSP and zero block RAM — paid for with a pipeline n carry-propagate adders deep."
kind: circuit
source: "ASA §20.4.1, §20.4.3–20.4.5, §20.7, pp. 607-613, 621"
status: seed
spade: simulated
tags: [digital, cordic, sine, cosine, pipeline, fpga, shift-and-add]
aliases:
  - Fully Pipelined CORDIC
  - Pipelined CORDIC
  - Unrolled CORDIC Operator
---

# Unrolled CORDIC

The CORDIC micro-rotation recurrence instantiated $n=-\ell+2$ times in space rather than $n$ times in sequence, so the iteration index $i$ is a compile-time constant in every copy and the two barrel shifters and the constant table that the sequential version needs both vanish.

```tikz title="Unrolled CORDIC: n hardwired stages, and the datapath inside one of them"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ================= left: the unrolled chain
\node[font=\small\bfseries] at (2.1,9.9) {unrolled operator};
\node[font=\tiny,anchor=south] at (2.1,9.2) {$Y'$, $-\ell+g+1$ bits};
\draw[->] (2.1,9.15) -- (2.1,8.75);
\node[draw,minimum width=4.2cm,minimum height=0.6cm,font=\tiny] (s1) at (2.1,8.45)
  {stage 1: $\gg1$, $+\tfrac1\pi\arctan2^{-1}$};
\node[draw,minimum width=4.2cm,minimum height=0.6cm,font=\tiny] (s2) at (2.1,7.45)
  {stage 2: $\gg2$, $+\tfrac1\pi\arctan2^{-2}$};
\draw[->] (s1) -- (s2);
\node[font=\small] at (2.1,6.75) {$\vdots$};
\draw[->] (s2) -- (2.1,7.0);
\node[draw,minimum width=4.2cm,minimum height=0.6cm,font=\tiny] (sn) at (2.1,5.95)
  {stage $n$: $\gg n$, $+\tfrac1\pi\arctan2^{-n}$};
\draw[->] (2.1,6.5) -- (sn);
\node[draw,minimum width=1.8cm,minimum height=0.5cm,font=\tiny] (rd) at (2.1,5.0) {round};
\draw[->] (sn) -- (rd) node[midway,right,font=\tiny] {$-\ell+g+1$};
\draw[->] (rd) -- (2.1,4.4) node[below,font=\tiny] {$(C,S)$, $-\ell+1$ bits};
\node[anchor=north west,font=\tiny,align=left] at (-0.1,3.85)
  {$n=-\ell+2$ stages, identical\\
   but for the constants\\
   every $\gg i$ is wiring,\\
   every $\arctan$ a literal\\
   $\approx2.5(-\ell+g)^2$ LUTs\\
   0 DSP, 0 BRAM\\
   latency $=n$ dependent\\
   carry-propagate adds};
\draw[gray!50] (4.9,10.2) -- (4.9,2.0);
% ================= right: the guts of one stage
\begin{scope}[xshift=6.3cm,yshift=5.0cm]
\node[font=\small\bfseries] at (3.8,4.9) {one stage, expanded};
\node[font=\small] (ci) at (0,3.9) {$C_i$};
\node[font=\small] (si) at (3.4,3.9) {$S_i$};
\node[font=\small] (zi) at (7.6,3.9) {$Z_i$};
\node[draw,minimum width=1.3cm,minimum height=0.6cm] (shs) at (0.9,2.6) {$\gg i$};
\node[draw,minimum width=1.3cm,minimum height=0.6cm] (shc) at (2.5,2.6) {$\gg i$};
\draw (ci) -- (0,1.1);
\draw (si) -- (3.4,1.1);
\draw[->] (0,3.1) -- (2.5,3.1) -- (shc.north);
\draw[->] (3.4,3.3) -- (0.9,3.3) -- (shs.north);
\draw[->] (0,1.15) -- (0,1.1);
\draw[->] (3.4,1.15) -- (3.4,1.1);
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (addc) at (0.45,0.8) {$\mp$ sub/add};
\node[draw,minimum width=1.9cm,minimum height=0.7cm] (adds) at (2.95,0.8) {$\pm$ add/sub};
\draw[->] (shs.south) -- (0.9,1.15);
\draw[->] (shc.south) -- (2.5,1.15);
\draw[->] (addc.south) -- (0.45,-0.2) node[below,font=\small]{$C_{i+1}$};
\draw[->] (adds.south) -- (2.95,-0.2) node[below,font=\small]{$S_{i+1}$};
\node[draw,minimum width=2.2cm,minimum height=0.7cm] (addz) at (7.6,0.8) {$\pm$ sub/add};
\draw[->] (zi) -- (addz.north);
\draw[<-] (8.7,0.8) -- ++(0.9,0) node[right,font=\small]{$\tfrac{1}{\pi}\arctan 2^{-i}$};
\draw[->] (addz.south) -- (7.6,-0.2) node[below,font=\small]{$Z_{i+1}$};
\draw[->] (7.15,3.65) -- (5.6,3.65) -- (5.6,0.8) -- (4.0,0.8);
\draw[->] (5.6,2.1) -| (0.45,1.15);
\node[font=\tiny,above] at (5.85,3.65) {$d_i=$ sign bit of $Z_i$, 1 bit};
\node[font=\tiny,left] at (-0.05,2.2) {$-\ell+g+1$};
\node[font=\tiny,right] at (3.5,2.2) {$-\ell+g+1$};
\node[font=\tiny,right] at (7.7,2.4) {$-\ell+g+1$};
\node[font=\tiny,right] at (0.45,0.2) {$-\ell+g+1$};
\node[font=\tiny,right] at (7.6,0.2) {$-\ell+g+1$};
\node[font=\tiny,align=left,anchor=north west] at (-0.6,-1.15)
  {the shift is a constant $i$ in each copy, so it is routing and costs no logic;\\
   $\tfrac1\pi\arctan2^{-i}$ is a literal at the adder input, so there is no table;\\
   $d_i$ is the sign bit of $Z_i$ and is the only control signal in the whole operator};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 20.8, p. 608, replicated into the $n=-\ell+2$ stage pipeline; widths from Sect. 20.4.4–20.4.5*

**Fix what a single stage owes the next one.** Every stage carries three values in the same fixed-point format $\mathrm{sfix}(0,\ell-g)$ — $-\ell+g+1$ bits, one sign bit and $-\ell+g$ fractional bits (see [[Number Formats]]) — and applies one micro-rotation of [[CORDIC Rotation Mode]]:

$$\forall i\ge1\quad\begin{cases}
d_i=+1\ \text{if}\ Z_i>0,\ \text{else}\ -1\\
C_{i+1}=C_i-2^{-i}d_iS_i\\
S_{i+1}=S_i+2^{-i}d_iC_i\\
Z_{i+1}=Z_i-d_i\tfrac1\pi\arctan 2^{-i}
\end{cases}\tag{20.27}$$

with $C_1=(1-2^{\ell})/K$, $S_1=0$, $Z_1=Y'$ and $K=\prod_{i=1}^{n}\sqrt{1+2^{-2i}}$. Three adders, two shifts, one bit of control. The output scaling $(1-2^{\ell})$ demanded by the specification and the modulus growth $K$ contributed by dropping $\cos\alpha_i$ are both folded into the single literal $C_1$, so neither costs a gate (p. 609). $Y'$ arrives from [[Octant Argument Reduction]] as $-\ell-2$ bits in $[0,\tfrac14)$ and is zero-padded into the working format; the iteration starts at $i=1$, not $i=0$, because the reach from $i=1$ is $54.9^\circ>45^\circ$.

> [!important] Unrolling is what makes the shifts free
> In (20.27) $i$ is a loop variable. Unroll the loop and $i$ becomes *a different literal in each of $n$ distinct pieces of hardware*, so $\gg i$ is a fixed reindexing of a bus — pure routing, zero LUTs, zero delay — and $\tfrac1\pi\arctan2^{-i}$ is a constant driving an adder input rather than an entry read from a table. The sequential variant can have neither: with $i$ varying at runtime it needs two real barrel shifters ([[Shifters]]) plus a ROM of the $\arctan$ constants, together more logic than the three adders they serve (p. 621). That is the entire content of the word "unrolled", and it is why [[Iterative CORDIC]] is not simply this circuit run slowly.

**Count the stages from the approximation half of the error budget.** For large $i$, $\arctan2^{-i}\approx2^{-i}$ by the Taylor series of $\arctan$, so stage $i$ removes $\Theta(2^{-i})$ from $Z_i$ and adds strictly less than $2^{-i}$ to $C_i,S_i$, since $|C_i|,|S_i|<1$. **Each stage buys at least one bit**, so cutting the sequence at

$$n=-\ell+2$$

leaves $\delta_\text{approx}\le2^{\ell-2}$: exactly the quarter-ulp that Sect. 20.4.2 allocates to stopping early, the other quarter-ulp going to rounding and the remaining half-ulp to the final rounding of the result (the three-way split is the standard one of [[Error Accuracy]]). **Pipeline depth is therefore linear in the precision**, and that single fact is what eventually loses this architecture the comparison.

**Pay for the guard bits, which grow with the precision.** Truncating each shifted addend costs under one internal ulp $u=2^{\ell-g}$, but the errors *compound* rather than accumulate: stage $i+1$ truncates afresh **and** inherits a wrong $\widetilde C_i$ through its own shift. Subtracting the exact recurrence from the computed one and regrouping gives, in ulps,

$$\bar\delta_{\text{round},i+1}=1+(2^{-i}+1)\,\bar\delta_{\text{round},i}\tag{20.39}$$

started at $\bar\delta_{\text{round},1}=\tfrac12$ from rounding the constant $C_1$ into the working format. Imposing the budget $\bar\delta_\text{round}\cdot2^{\ell-g}<2^{\ell-2}$ then fixes $g=2+\lfloor\log_2\bar\delta_\text{round}\rfloor$ (20.42). Worked for $\ell=-12$: $n=14$, the recurrence reaches $\bar\delta_\text{round}=15.31$, so $g=5$ and the datapath is 18 bits wide. Because the recurrence runs for $n$ steps and $n$ is set by $\ell$, **$g$ grows like $\log_2$ of the precision** — the structural price of feeding errors through $n$ dependent stages, and precisely what [[Table-and-Multiplier Sine and Cosine]] escapes with its constant $g=4$. Round-to-nearest instead of truncation buys nothing: it replaces one rounding of $u$ by two of $u/2$, same total, one extra bit in every adder. **Truncate.**

**Read the area straight off the FPGA fabric.** Each bit of the $C$ and $S$ updates is a select-then-add — choose $\pm2^{-i}\widetilde S_i$ on $d_i$, then add — and that fits in **one LUT per bit while still driving the fast carry chain** ([[Lookup-Tables]], [[Adders]]), the LUT computing the sum bit's inputs and the dedicated carry logic doing the propagation. So the cost formula is close to exact:

$$\text{LUTs}\approx\underbrace{2(-\ell+g)(-\ell+2)}_{C\ \text{and}\ S\ \text{over}\ n\ \text{stages}}\;+\;\underbrace{\tfrac12(-\ell+g)^2}_{\text{triangular }Z}$$

The $Z$ term is a triangle rather than a rectangle because $|Z_{i+1}|<2^{-i}$ kills one leading bit per stage — see [[Reduced-Z CORDIC Datapath]], a saving available *only* because the stages are distinct hardware. **Nothing else is instantiated**: no multiplier, no memory, no shifter. On an ASIC the three adders per stage survive unchanged, but the argument loses its sharpest edge, because one-LUT-per-bit-plus-hard-carry is an FPGA fact and not a technology-independent one ([[FPGAs]], p. 621).

$$\boxed{\ n=-\ell+2\ \text{stages},\qquad \text{LUTs}\approx2.5\,(-\ell+g)^2,\qquad 0\ \text{DSP},\ 0\ \text{BRAM}\ }$$

Quadratic in the precision on area, linear on depth, and every gate drawn from the cheapest resource on the die.

## When it breaks

- **Delay.** The $n$ stages are $n$ *dependent* carry-propagate additions. With all tables and multipliers forced into logic for a fair comparison, unrolled CORDIC and the table-and-multiplier architecture consume very comparable resources, but CORDIC is slower by a factor 2 at 16 bits and a factor 3 at 32 bits [DIS13], p. 621. Registering between stages restores throughput but not latency, and costs $3n(-\ell+g+1)$ flip-flops.
- **The DSPs and block RAMs sit idle.** "No multiplier at all" is the whole argument for this circuit, and on a modern FPGA it only bites when the [[DSP Blocks]] and memories are genuinely absent or already saturated by the rest of the design.
- **Range.** Convergence from $i=1$ reaches only $54.9^\circ$. Feed it an unreduced angle and it returns a wrong answer silently rather than failing; the octant reduction is not optional.
- **$d_i$ near zero.** When $Z_i\approx0$, rounding can make the architecture choose a different $d_i$ from the infinitely precise sequence and the two computations part company. Do not try to prevent it — redefine the reference as the exact sequence that makes the *same* decisions. Both branches converge anyway, since either sign at a near-zero residual leaves a residual the tail can still absorb (p. 612).
- **Half the stages are removable.** Once $Z_i<2^{\ell/2-1}$ the residual rotation can be applied directly by two small multiplications; [[Reduced-Iteration CORDIC]] takes over at $i=\lfloor-\ell/2\rfloor+1$.

> [!warning] No synthesis numbers exist for this operator in the source
> Chapter 20 publishes no LUT/FF/slice/ns table. Everything above is the cost *formula* the text states plus the one relative measurement it cites [DIS13]. Absolute device numbers, and the ASIC comparison against redundant-arithmetic CORDIC ([[Redundant Number Systems]]), need outside research — the book calls the latter explicitly open (p. 621).

## RTL (Spade)

```spade
/// N unrolled CORDIC stages. `gen if` recursion elaborates N *distinct* copies,
/// so `i` is a compile-time constant inside each one: every `>>> i` is routing
/// and every `atan[0]` is a hardwired literal.
fn cordic_stages<#uint W, #uint N>(
    c: int<W>,
    s: int<W>,
    z: int<W>,
    atan: [int<W>; N],
    i: int<W>,
) -> (int<W>, int<W>) {
    gen if N == 0 {
        (c, s)
    } else {
        let d = z >= 0;
        let cs: int<W> = c >>> i;
        let ss: int<W> = s >>> i;
        cordic_stages(
            if d { c -. ss } else { c +. ss },
            if d { s +. cs } else { s -. cs },
            if d { z -. atan[0] } else { z +. atan[0] },
            atan[1..N],
            i +. 1,
        )
    }
}

/// l = -12, g = 5: an 18-bit datapath, n = -l+2 = 14 stages.
/// C_1 = round(2^17 (1-2^-12)/K), atan[i] = round(2^17 arctan(2^-i)/pi).
entity cordic_unrolled(y: int<18>) -> (int<18>, int<18>) {
    cordic_stages(
        112535,
        0,
        y,
        [19344, 10221, 5188, 2604, 1303, 652, 326, 163, 81, 41, 20, 10, 5, 3],
        1,
    )
}
```

`y` is the $Y'$ entering the left column of the diagram and `(c, s)` is the pair leaving stage $n$, everything at $W=-\ell+g+1=18$ bits; the `round` box is left to the caller. `>>> i` is the arithmetic right shift, and because `i` is a generic-recursion constant it lowers to a sign-extended bit slice — no shifter instantiated, which is the "shifts are wiring" claim made good. `-.` and `+.` are the *truncating* adds, so the block is (20.32) exactly; the widening `-`/`+` would grow the datapath by one bit per stage. The `if d { .. } else { .. }` pairs are not muxes in silicon: synthesis folds the select into the adder's invert-and-carry-in control, which is what makes the one-LUT-per-bit figure reachable at all. The block is purely combinational — inserting a `reg;` between stages inside a `pipeline(14)` is the only change needed to get the fully pipelined operator.

Simulated against `$sin`/`$cos` on 3007 vectors — 7 named, including the asymmetric $Y'=1$ and $Y'=2^{15}-1$, plus a 3000-point random sweep of the octant — all inside 24 internal ulps, the bound $\lceil\bar\delta_\text{round}\rceil+2^{g-2}$ derived above. One deviation from (20.27): the RTL takes $d_i=+1$ when $Z_i=0$ rather than $-1$, harmless because a zero residual needs no rotation.

## Related Notes

- [[CORDIC Rotation Mode]] – depends-on: derives the recurrence (20.27) that this note replicates $n$ times.
- [[Iterative CORDIC]] – compares: the same recurrence rolled back into one stage, trading two barrel shifters and an arctan ROM for $n\times$ less datapath.
- [[Reduced-Z CORDIC Datapath]] – extends: shrinks stage $i$'s $Z$ adder by one bit, possible only once the stages are distinct hardware.
- [[Reduced-Iteration CORDIC]] – extends: stops at $\lfloor-\ell/2\rfloor+1$ stages and finishes the rotation with two small multipliers.
- [[Octant Argument Reduction]] – depends-on: supplies $Y'\in[0,\tfrac14)$, without which the $i=1$ start does not converge.
- [[Table-and-Multiplier Sine and Cosine]] – counter-example: comparable LUT cost, 2–3× the speed, and a guard-bit count independent of $\ell$.
- [[Choosing a CORDIC Architecture]] – compares: where this sits against every sibling on one specification.
- [[Lookup-Tables]] – supports: the one-LUT-per-bit-on-the-carry-chain mapping that the area formula assumes.
- [[DSP Blocks]] – counter-example: the resources this architecture deliberately leaves untouched, and the reason its argument has weakened.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 20 "Fixed-Point Sine and Cosine".

- **20.4.1**, pp. 607–609 — recurrence (20.26)–(20.27), Table 20.1 p. 607, Fig. 20.8 p. 608, and the paragraph on p. 609 defining the unrolled operator and merging $(1-2^{\ell})$ into $C_1$.
- **20.4.2–20.4.3**, pp. 609–610 — the error split (20.28)–(20.30) and $n=-\ell+2$.
- **20.4.4–20.4.5**, pp. 610–613 — truncation versus round-to-nearest (20.32)–(20.34), the compounding recurrence (20.39), $g$ from (20.42), the reduced $Z$ datapath and the LUT formula, p. 613.
- **20.7**, p. 621 — the [DIS13] delay comparison, iterative versus unrolled, and the open ASIC question.
