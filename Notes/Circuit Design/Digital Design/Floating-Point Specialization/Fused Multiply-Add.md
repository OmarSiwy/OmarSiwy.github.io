---
title: "Fused Multiply-Add"
description: "One rounding of A*B+C instead of two: bounds the error against the result rather than the intermediate, paid for by a ~3w_F-bit internal datapath."
kind: circuit
source: "ASA §15.6, pp. 469-470"
status: seed
spade: simulated
tags: [digital, floating-point, fma, rounding, fpga, floating-point-specialization]
aliases:
  - FMA
  - Fused Multiply and Add
  - Fused Multiply Add
  - Fused multiply-add
---

# Fused Multiply-Add

An operator that computes $A\times B+C$ with a **single rounding of the exact result**, which is what separates it from a multiplier feeding an adder and is the reason it costs more than both combined.

```tikz title="Separate multiplier and adder with two roundings beside a fused multiply-add with one, on a wider internal datapath"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\footnotesize,>=stealth]
% ---------------- unfused: multiply then add ----------------
\node[font=\small] at (0,9.0) {\textbf{multiplier, then adder}};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (m1) at (0,7.0) {significand mult.\\$(w_F{+}1)\times(w_F{+}1)$};
\node[draw,very thick,minimum width=4.4cm,minimum height=0.9cm,align=center] (m2) at (0,5.2) {normalize \& \textbf{round \#1}\\{\tiny to the product's own ulp}};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (m3) at (0,3.1) {align $C$, then add\\{\tiny $(w_F{+}3)$-bit adder}};
\node[draw,very thick,minimum width=4.4cm,minimum height=0.9cm] (m4) at (0,1.3) {normalize \& \textbf{round \#2}};
\draw[<-] ([xshift=-11mm]m1.north) -- ++(0,0.8) node[above,font=\small]{$A$};
\draw[<-] ([xshift=11mm]m1.north) -- ++(0,0.8) node[above,font=\small]{$B$};
\draw[->] (m1.south) -- node[right,font=\tiny]{$2w_F{+}2$ exact} (m2.north);
\draw[->] (m2.south) -- node[right,font=\tiny]{$w_F{+}1$ \textbf{(truncated)}} (m3.north);
\draw[<-] (m3.east) -- node[above,font=\tiny]{$1{+}w_E{+}w_F$} ++(1.4,0) node[right,font=\small]{$C$};
\draw[->] (m3.south) -- node[right,font=\tiny]{$w_F{+}4$} (m4.north);
\draw[->] (m4.south) -- node[right,font=\tiny]{$w_F{+}1$} ++(0,-0.85) node[below,font=\small]{$\hat r$};
\node[font=\tiny,align=left,anchor=north west] at (-2.5,-1.6)
  {round \#1 injects $\delta_1 ab$: half an ulp\\
   \emph{of the product}. Nothing bounds it\\
   relative to $ab{+}c$ once $c\approx-ab$.};
% ---------------- fused: FMA ----------------
\node[font=\small] at (8.6,9.0) {\textbf{fused multiply-add}};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (n1) at (8.6,7.0) {significand mult.\\$(w_F{+}1)\times(w_F{+}1)$};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (n2) at (8.6,5.2) {align $C$ anywhere\\ above or below $AB$};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (n3) at (8.6,3.55) {exact add/sub};
\node[draw,minimum width=4.4cm,minimum height=0.9cm,align=center] (n4) at (8.6,2.0) {LZA $+$ normalize\\{\tiny left shift up to $2w_F{+}2$}};
\node[draw,very thick,minimum width=4.4cm,minimum height=0.75cm] (n5) at (8.6,0.5) {\textbf{round} (once)};
\draw[<-] ([xshift=-11mm]n1.north) -- ++(0,0.8) node[above,font=\small]{$A$};
\draw[<-] ([xshift=11mm]n1.north) -- ++(0,0.8) node[above,font=\small]{$B$};
\draw[->] (n1.south) -- node[right,font=\tiny]{$2w_F{+}2$ exact, \textbf{never rounded}} (n2.north);
\draw[<-] (n2.east) -- node[above,font=\tiny]{$1{+}w_E{+}w_F$} ++(1.4,0) node[right,font=\small]{$C$};
\draw[->] (n2.south) -- node[right,font=\tiny]{$\approx 3w_F$} (n3.north);
\draw[->] (n3.south) -- node[right,font=\tiny]{$\approx 3w_F$} (n4.north);
\draw[->] (n4.south) -- node[right,font=\tiny]{$w_F{+}2$} (n5.north);
\draw[->] (n5.south) -- node[right,font=\tiny]{$w_F{+}1$} ++(0,-0.85) node[below,font=\small]{$\hat r_{\mathrm{FMA}}$};
\node[font=\tiny,align=left,anchor=north west] at (5.4,-1.6)
  {one $\delta$ on the \emph{result}:\\
   $|\hat r_{\mathrm{FMA}}-(ab{+}c)|\le u\,|ab{+}c|$,\\
   paid for by the $\approx 3w_F$-bit bus.};
% ---------------- the difference ----------------
\draw[<->,thick] (2.95,4.15) -- node[above,font=\tiny,align=center]{one rounding\\deleted} (6.3,4.15);
\end{circuitikz}
\end{document}
```

*Own construction; §15.6 states the architecture in prose and gives it no figure.*

**Locate the one rounding the fusion deletes.** Let $u=2^{-w_F-1}$ be the unit roundoff of $\mathrm{float}\langle w_E,w_F\rangle$ and $\circ(\cdot)$ round-to-nearest ([[Error Accuracy]], [[Number Formats]]). Unfused, each rounding contributes a relative perturbation $|\delta_i|\le u$:

$$\hat r=\circ\big(\circ(ab)+c\big)=\big(ab(1+\delta_1)+c\big)(1+\delta_2)$$

Expand and drop the $O(u^2)$ cross term:

$$\hat r-(ab+c)=\underbrace{\delta_2\,(ab+c)}_{\le\,u\,|ab+c|}\;+\;\underbrace{\delta_1\,ab}_{\le\,u\,|ab|}$$

The two terms are measured against *different* quantities — the second is a half-ulp **of the product**. Fusing removes $\delta_1$ outright:

$$\hat r_{\mathrm{FMA}}=\circ(ab+c)=(ab+c)(1+\delta)\ \Longrightarrow\ |\hat r_{\mathrm{FMA}}-(ab+c)|\le u\,|ab+c|$$

**Read that bound twice, because only the second reading is the case for fusion.** Without cancellation, $|ab|\lesssim|ab+c|$, so the chain is bounded by $2u$ — one ulp — against the FMA's $u$. Rounding once instead of twice halves the bound; with two *faithful* roundings in place of two correct ones the same argument gives 2 ulp against 1. Useful, unspectacular. With cancellation, $c\approx-ab$, the term $\delta_1\,ab$ is bounded by **nothing at all** relative to $ab+c$: the chain's relative error is unbounded while the FMA's is still $u$.

> [!important] The gap is not half an ulp, it is unbounded
> Take $\mathrm{float}\langle 5,4\rangle$, $A=B=1.0001_2=\tfrac{17}{16}$, $C=-1.0010_2=-\tfrac{288}{256}$. The exact product $\tfrac{289}{256}=1.00100001_2$ needs 8 fractional bits, twice the format, and its tail $0001_2$ at weight $2^{-8}$ sits below the half-ulp $2^{-5}$, so $\circ(AB)=\tfrac{288}{256}$ and the chain returns $\mathbf{0}$. The FMA rounds $AB+C=2^{-8}$ once, and $2^{-8}$ is representable, so it returns $2^{-8}$ exactly. The chain's absolute error $2^{-8}$ is $0.0625$ ulp *of the product* — well inside its own bound — and $16$ ulp *of the result*, a $100\%$ relative error. That is the $\delta_1\,ab$ term made visible.

**Pay for the deleted rounding with a wider bus, because the algebra leaves no choice.** The exact product of two $(w_F{+}1)$-bit significands occupies $2w_F+2$ bits, and rounding it is exactly what fusion forbids, so all $2w_F+2$ bits must survive into the adder. $C$ carries $w_F+1$ significand bits at an exponent that may land anywhere above or below the product, so the accumulator must span the product's $2w_F+2$ bits plus roughly $w_F$ bits of headroom above and $w_F$ of tail below — **$\approx 3w_F$ bits** before the single rounding. A separate multiplier and adder each carry only $\approx w_F$ significant bits past their own rounding, which is why the book states bluntly that an FMA is **more expensive than an adder and a multiplier combined** (p. 469). The wide sum then needs a full leading-zero anticipator and a normalizer with a left-shift range of up to $2w_F+2$ ([[Shifters]]), where a plain [[Floating-Point Operators|floating-point adder]] normalizes over $w_F+2$.

**Note that this is the one operator in the chapter that is not application-specific.** Every other section here specializes: a constant operand, a positive-term restriction, a small odd divisor. The FMA goes the other way — it is a *universal* operator that subsumes addition as $A\times1+C$ and multiplication as $A\times B+0$, which is why IEEE-754 standardized it (p. 469). Its universality is bought with the $\approx 3w_F$ datapath; specialization buys the reverse trade.

**Exploit the exactness, not just the error bound.** Because the product is never rounded, $\circ(c-ab)$ from an FMA is *exact* whenever $c-ab$ is representable — the residual of a candidate result comes back with no error of its own. That exact-residual property is what lets a Newton-Raphson or Goldschmidt iteration refine an approximate quotient to a correctly rounded one ([[Division by Reciprocal]]), and it is why IEEE division and square root are implementable on top of an FMA with no dedicated divider. An [[Exact Accumulators|exact accumulator]] takes the same idea to its limit: never round at all, over a whole sum.

**Fuse further only where the terms cannot cancel.** Sums of two products [SS08; Tao+13], sums of squares [DKP09; MS13], and sums of three [Tao+12] or four [Tao+13] floats have all been fused. The design rule the book extracts (p. 470) is that *faithful* rounding gives significantly cheaper fused operators **only for sums of same-sign terms**; otherwise large cancellation is possible, handling it properly requires computing most of the bits of the exact result anyway, and relaxing from correct to faithful rounding saves almost nothing. This closes the loop with the [[Positive-Term Floating-Point Adder|positive-term adder]]: [[Fused Sum of Squares|sums of squares]] are cheap to fuse for exactly the reason positive-term addition is cheap to specialize, and the faithful sum of three squares is the book's opening example of fusion (Fig. 1.5, p. 12), saving both area and latency.

**On FPGA the wide accumulator is less of a penalty than the arithmetic suggests.** The $2w_F+2$ exact product is what a DSP block produces natively — it is only the rounding stage that throws those bits away — and the post-adder inside the DSP block absorbs part of the alignment sum for free ([[FPGAs]]). What does not come free is the $\approx 3w_F$ shifter and the LZA, both of which are LUT-and-routing structures that scale badly. On ASIC the balance is the opposite: the wide multiplier array dominates and the shifters are cheap.

$$\boxed{\ |\hat r_{\mathrm{FMA}}-(ab+c)|\le u\,|ab+c|,\quad u=2^{-w_F-1},\ \text{on a}\ \approx 3w_F\ \text{bit exact accumulator}\ }$$

**When it breaks**

- **Cancellation is where the bound earns its keep, and also where the hardware costs most.** A full-width LZA plus a $2w_F+2$ left shift exists solely for the case $c\approx -ab$; if the application cannot cancel, the whole close path is dead silicon and a fused positive-term operator is strictly better.
- **Subnormals.** The single-rounding argument assumes $\hat r$ is normal. Once the exact $ab+c$ falls below $2^{e_{\min}}$ the result is rounded to a fixed absolute ulp, the relative bound $u|ab+c|$ no longer holds, and the operator needs the usual saturating-normalizer path.
- **It is not free accuracy for a dot product.** One FMA rounds once; a length-$n$ accumulation through FMAs still rounds $n-1$ times. If the sum itself is the problem, the answer is an [[Exact Accumulators|exact accumulator]], not an FMA chain.
- **Latency.** The serialized multiply, align, add, LZA, normalize, round chain is longer than a multiplier alone. Where throughput matters more than the last ulp, a rounded multiplier feeding a separate adder pipelines shorter and deeper.
- **`fma(a, b, -a*b)` is not zero-cost error extraction unless the FMA is correctly rounded**; a faithfully rounded fused operator loses the exact-residual property that most of its algorithmic uses depend on.

**RTL (Spade)**

```spade
/// Fused multiply-add core: one rounding of a*b + (c << sh).
/// a, b, c are (w_F+1) = 8-bit significands; sh aligns C anywhere inside
/// the 24-bit (~3 w_F) accumulator window. The product is never rounded.
entity fma_core(a: uint<8>, b: uint<8>, c: uint<8>, sh: uint<4>) -> uint<17> {
    let p: uint<24> = zext(a * b);
    let ca: uint<24> = zext(c) << zext::<4, 24>(sh);
    let s: uint<25> = p + ca;
    trunc((s + 128) >> 8)
}
```

`p` is the "significand mult." box: `a * b` is `uint<16>` by Spade's width rule for `*`, zero-extended into the 24-bit accumulator and **never truncated**, which is the whole point of the diagram's missing round #1. `ca` is the alignment shifter; `sh` is deliberately narrower than the bus so `c` never falls off the top. `s` is the exact add at `uint<25>` — `+` grows by one bit, and that bit is the carry-out the diagram labels $\approx 3w_F$. The final line is the single rounding, round-half-up at a *fixed* weight: adding $2^7$ and truncating 8 bits. A real FMA rounds at a **data-dependent** weight chosen by the LZA, so synthesis puts a full normalizer between `s` and the rounding that this block does not draw; everything is combinational, no clock.

Simulated with `.zettel/sim.sh` against a behavioural `((a*b + (c<<sh)) + 128) >> 8`: 7 named vectors including the asymmetric $1\times128$ and its transpose, plus 4000 random $(a,b,c,sh)$ — 4007/4007 exact. The same sweep against the unfused `round(a*b) + round(c<<sh)` disagrees on **527 of 4000** vectors, which is the $\delta_1$ term counted rather than bounded.

**Related Notes**

- [[Floating-Point Operators]] – compares: the FMA is the universal operator every specialized operator in this topic is measured against.
- [[Division by Reciprocal]] – supports: consumes the FMA's exact residual to reach correct rounding by Newton-Raphson refinement.
- [[Exact Accumulators]] – extends: takes "never round the intermediate" from one product to an unbounded sum.
- [[Error Accuracy]] – depends-on: supplies $u$, ulp and the round-to-nearest model the whole bound is written in.
- [[Fused Sum of Squares]] – extends: the same fusion where same-sign terms make faithful rounding actually cheaper.
- [[Positive-Term Floating-Point Adder]] – compares: the no-cancellation case whose cheapness explains the design rule of §15.6.
- [[Fused Add-Subtract Unit]] – compares: fuses by sharing an alignment shifter rather than by deleting a rounding.
- [[Choosing a Specialized Floating-Point Operator]] – compares: where a universal FMA loses to a specialized operator.

## References

- [[3.4) Floating-Point Specialization]] — §Fused multiply-add and other sums of products, and the worked counter-example at $w_F=4$.
- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §15.6 "Fused Multiply and Add, Other Sums of Products", pp. 469-470 — the single-rounding definition, the universality remark, the "more expensive than an adder and a multiplier combined" cost statement, and the same-sign design rule for faithful fusion.
- Same volume, §15.4 addition of positive terms p. 468 and §15.5 combined sum and difference p. 469 for the sibling fusions; Fig. 1.5 p. 12 for the faithful sum of three squares; Fig. 11.5 p. 337 and Fig. 11.6 p. 341 for the generic floating-point adder the FMA's align/normalize path is compared against; §10.3 for the normalizer.
- Cited by §15.6 without further detail here: [Mar00; CHT02; Mul+18] FMA-based division and square root; [MHR90; HMC90; Sei03; LB04; BL05; SST05; Yu+06; Tro+07; QSL07; Lut11] FMA implementations; [SS08; Tao+13] sum of two products; [DKP09; MS13; Tao+13] sum of squares; [Tao+12] sum of three floats.
