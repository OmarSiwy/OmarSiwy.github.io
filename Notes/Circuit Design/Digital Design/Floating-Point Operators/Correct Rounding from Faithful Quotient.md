---
title: Correct Rounding from Faithful Quotient
description: "Buys the last ulp out of a faithful quotient one bit wider than the target: if the LSB is 0 it is already correctly rounded, otherwise a left-truncated multiplier decides the sign of the remainder. A whole multiply and a second rounding for one bit."
kind: circuit
source: "ASA §11.3.4, pp. 351-352"
status: seed
spade: simulated
tags: [digital, floating-point-operators, division, rounding, multiplier]
aliases:
  - Correct Rounding of a Faithful Quotient
  - Correct Rounding from a Faithful Quotient
  - Correct Rounding Out of a Faithfully Rounded Quotient
  - Correctly Rounded Divider
---

# Correct Rounding from Faithful Quotient

A post-processing block that upgrades a faithfully rounded quotient significand to a correctly rounded one, and the only rounding unit in the chapter whose decision comes from a *multiplication* rather than from bits the operator already had.

```tikz title="Correct rounding from a faithful quotient: the two LSB cases on the real line, and the datapath that decides the midpoint case from a left-truncated product"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ==================== Fig. 11.9 (a) : M_Q lands on the grid ==============
\begin{scope}
  \draw[->] (0,0) -- (5.9,0) node[right,font=\small] {$\mathbb{R}$};
  \foreach \x in {0.6,1.8,3.0,4.2,5.4} \draw[thick] (\x,-0.18) -- (\x,0.18);
  \foreach \x in {1.2,2.4,3.6,4.8} \draw (\x,-0.09) -- (\x,0.09);
  \draw[red,dashed] (2.60,-0.10) -- (2.60,0.72);
  \draw[red,dashed] (3.40,-0.10) -- (3.40,0.72);
  \draw[red,very thick] (2.60,0.34) -- (3.40,0.34);
  \node[red,anchor=west,font=\scriptsize] at (3.55,0.34) {interval of $M_{X/Y}$};
  \draw[<->] (3.0,0.62) -- (3.40,0.62);
  \node[anchor=south,font=\scriptsize] at (3.05,0.66) {$\delta<2^{-w_F-1}$};
  \draw[red,very thick] (3.0,-0.30) -- (3.0,0.30);
  \node[red,anchor=north,font=\small] at (3.0,-0.34) {$M_Q$};
  \node[anchor=north,font=\scriptsize,align=center] at (2.55,-1.05)
       {(a) LSB $=0$: $M_Q$ is already a ufix$(0,-w_F)$ number,\\so it \emph{is} the rounding of $M_{X/Y}$};
\end{scope}
% ==================== Fig. 11.9 (b) : M_Q lands on a midpoint ============
\begin{scope}[xshift=8.0cm]
  \draw[->] (0,0) -- (5.9,0) node[right,font=\small] {$\mathbb{R}$};
  \foreach \x in {0.6,1.8,3.0,4.2,5.4} \draw[thick] (\x,-0.18) -- (\x,0.18);
  \foreach \x in {1.2,2.4,3.6,4.8} \draw (\x,-0.09) -- (\x,0.09);
  \draw[red,dashed] (2.05,-0.10) -- (2.05,0.72);
  \draw[red,dashed] (2.75,-0.10) -- (2.75,0.72);
  \draw[red,very thick] (2.05,0.34) -- (2.75,0.34);
  \node[red,anchor=west,font=\scriptsize] at (3.15,0.34) {interval of $M_{X/Y}$};
  \draw[<->] (2.4,0.62) -- (2.75,0.62);
  \node[anchor=south,font=\scriptsize] at (2.45,0.66) {$\delta<2^{-w_F-1}$};
  \draw[red,very thick] (2.4,-0.30) -- (2.4,0.30);
  \node[red,anchor=north,font=\small] at (2.4,-0.34) {$M_Q$};
  \node[ocirc,scale=1.1] at (1.8,0) {};
  \node[ocirc,scale=1.1] at (3.0,0) {};
  \node[anchor=north,font=\scriptsize,align=center] at (2.55,-1.05)
       {(b) LSB $=1$: $M_Q$ is a midpoint; the sign of $\sigma M_X-M_QM_Y$\\picks which of the two circled neighbours};
\end{scope}
% ==================== the decision datapath ==============================
\begin{scope}[yshift=-4.6cm,xshift=1.4cm]
  % ---- gates ----
  \node[xor port,scale=0.6] (xg) at (6.65,0.0) {};
  \node[and port,scale=0.6] (ag) at (8.65,-0.90) {};
  % ---- inputs ----
  \node[font=\small] at (0.0,2.42) {$M_Q$};
  \node[font=\small] at (3.4,2.42) {$M_Y$};
  \node[font=\small] at (5.2,2.42) {$\sigma M_X$};
  \draw[->] (0.0,2.25) -- (0.0,1.40);
  \draw[->] (3.4,2.25) -- (3.4,1.40);
  \draw[->] (5.2,2.25) -- (5.2,-0.13) -- (xg.in 2);
  \node[font=\tiny,anchor=west] at (0.08,1.55) {$w_F{+}2$};
  \node[font=\tiny,anchor=west] at (3.48,1.55) {$w_F{+}1$};
  \node[font=\tiny,anchor=west] at (5.28,1.55) {$w_F{+}1$};
  \node[font=\tiny,anchor=west] at (5.28,0.70) {bit $2^{-w_F}$ of $\sigma M_X$};
  % ---- M_Q fan-out ----
  \fill (0.0,1.75) circle (1.2pt);
  \draw[->] (0.0,1.75) -- (2.2,1.75) -- (2.2,1.40);
  \fill (0.0,2.05) circle (1.2pt);
  \draw[->] (0.0,2.05) -- (10.2,2.05) -- (10.2,-1.03) -- (ag.in 2);
  \node[font=\tiny,anchor=south] at (9.30,-0.97) {LSB$(M_Q)$};
  % ---- blocks ----
  \node[draw,minimum width=1.7cm,minimum height=0.7cm,font=\scriptsize]
       at (0.0,1.05) {drop LSB};
  \node[draw,minimum width=2.9cm,minimum height=0.8cm,align=center,font=\scriptsize]
       at (2.8,1.00) {left-truncated multiplier\\$M_QM_Y \bmod 2^{-w_F+1}$};
  \draw[->] (2.8,0.60) -- (2.8,0.13) -- (xg.in 1);
  \node[font=\tiny,anchor=south] at (4.05,0.16) {bit $2^{-w_F}$ of $M_QM_Y$};
  \draw[->] (xg.out) -- (7.80,0.0) -- (7.80,-0.77) -- (ag.in 1);
  % ---- increment and output ----
  \node[draw,minimum width=2.0cm,minimum height=0.7cm,font=\scriptsize]
       at (0.0,-1.95) {$+\,2^{-w_F}$ if};
  \draw[->] (ag.out) -- (9.60,-0.90) -- (9.60,-1.95) -- (1.02,-1.95);
  \node[font=\tiny,anchor=south] at (5.00,-1.92) {round up};
  \draw[->] (0.0,0.70) -- (0.0,-1.60);
  \node[font=\tiny,anchor=west] at (0.08,-0.55) {$w_F{+}1$};
  \draw[->] (0.0,-2.30) -- (0.0,-2.95) node[below,font=\small] {$M_R$};
  \node[font=\tiny,anchor=west] at (0.08,-2.65) {$w_F{+}1$};
  \node[font=\scriptsize,anchor=west] at (1.30,-2.85)
       {ufix$(0,-w_F)$, correctly rounded to nearest};
\end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 11.9, p. 352; the datapath below the number lines is my own reading of the accompanying text*

**Take the faithful divider's output one bit wider and stop before its rounding adder.** The [[Floating-Point Divider]] normalizes its raw quotient to a significand $M_Q$ in the format `ufix(0,`$-w_F-1$`)` — $w_F+2$ bits, MSB of weight $2^0$, LSB of weight $2^{-w_F-1}$, value in $[1,2)$ — one bit wider than the target `ufix(0,`$-w_F$`)`. That is exactly what the baseline's own faithful bound $|\delta_Q|<2^{-w_F-2}$ becomes after the possible one-bit left normalization, so no extra work inside the divider is being asked for; the only change is that the rounding adder is not applied yet. Writing $M_{X/Y}=\sigma M_X/M_Y$ for the *normalized* exact quotient, with $\sigma=1$ when $M_X/M_Y\ge1$ and $\sigma=2$ otherwise — the same $\sigma$ the divider already computed as the comparison $M_X<M_Y$ that drives its normalization — faithfulness reads

$$\big|M_Q-M_{X/Y}\big|<2^{-w_F-1} \tag{11.3}$$

$M_X$ and $M_Y$ are the input significands in `ufix(0,`$-w_F$`)`, $w_F+1$ bits each. See [[Number Formats]] for the `ufix` notation and [[Error Accuracy]] for why "faithful" means strictly less than one ulp of the stated format.

**The LSB of $M_Q$ splits the problem into a free case and a hard case, and nothing else does.** $M_Q$ sits on the $2^{-w_F-1}$ grid, which is the target grid $2^{-w_F}$ interleaved with its midpoints. If $\mathrm{LSB}(M_Q)=0$ then $M_Q$ is itself a `ufix(0,`$-w_F$`)` number, and (11.3) places $M_{X/Y}$ within half an ulp of it — panel (a). Half an ulp is precisely the defining radius of round-to-nearest, so $M_Q$ *is* the correctly rounded result and the block does nothing at all. If $\mathrm{LSB}(M_Q)=1$ then $M_Q$ is a midpoint between two consecutive floating-point significands, and (11.3) says the exact value lies strictly inside the union of the two half-ulp neighbourhoods either side — panel (b). The answer is one of $M_Q-2^{-w_F-1}$ and $M_Q+2^{-w_F-1}$, and only one bit of information is missing: which side of $M_Q$ the exact quotient falls on.

**That bit is the sign of a remainder, not of a difference of quotients.** Comparing $M_{X/Y}$ with $M_Q$ directly would require the exact quotient, which is what the whole exercise is trying to avoid. Multiply the comparison through by $M_Y>0$ instead — monotonicity of multiplication by a positive number preserves the order — and $M_{X/Y}\gtrless M_Q$ becomes $\sigma M_X\gtrless M_QM_Y$. So the decision is the sign of the remainder $\sigma M_X-M_QM_Y$: positive means the exact quotient is above the midpoint, round up; negative, round down. The case $\sigma M_X-M_QM_Y=0$ would be a genuine tie, but it cannot occur when the input and output formats are identical ([Mul+18] lemma 4.13, cited p. 349), so no tie rule is needed here.

**Only the low half of that product is ever built.** Multiply (11.3) by $M_Y$ and use $M_Y<2$:

$$\big|M_QM_Y-\sigma M_X\big| \;=\; M_Y\big|M_Q-M_{X/Y}\big| \;<\; 2\cdot2^{-w_F-1} \;=\; 2^{-w_F}$$

and $2^{-w_F}$ is exactly $\mathrm{ulp}(\sigma M_X)$ on the `ufix` grid the input significands live on. A real number strictly within one ulp of a grid point $g$ truncates either to $g$ or to $g-\mathrm{ulp}$, so every bit of $M_QM_Y$ of weight $2^{-w_F+1}$ and above is already known — it agrees with $\sigma M_X$ except for a possible borrow, and the borrow is what the one remaining bit reports. Nothing above weight $2^{-w_F}$ needs computing. The block that computes a product modulo a power of two is a **left-truncated multiplier**: in the partial-product array, an output column of weight $2^{-w_F}$ depends only on partial-product bits of weight $2^{-w_F}$ and below, so dropping the entire upper triangle is *exact*, not approximate. This is the mirror image of [[Truncated Multipliers]], where the discarded triangle is the low one and the truncation is precisely what costs accuracy.

**The comparison is a single XOR gate.** The two candidate truncations $\sigma M_X$ and $\sigma M_X-2^{-w_F}$ differ by exactly one ulp, and two integers differing by one always differ in their least significant bit. So instead of a $(w_F+1)$-bit [[Comparators|comparison]] against $\sigma M_X$, it suffices to compare the single bit of weight $2^{-w_F}$: equal means $M_QM_Y\ge\sigma M_X$, so the remainder is $\le0$ and $M_Q$ rounds down; different means $M_QM_Y<\sigma M_X$ and it rounds up. When $\sigma=2$ that bit of $\sigma M_X$ is hardwired to $0$ — doubling shifts the LSB of $M_X$ up one weight — so half the decisions are read straight off the multiplier output. The whole decision path is therefore one left-truncated multiply, one XOR, and one AND with $\mathrm{LSB}(M_Q)$.

**The round-up can never overflow the output format, and that is a property of division specifically.** The largest normalized exact quotient is bounded: for $\sigma=1$ the divisor satisfies $M_Y\ge1$, so $M_{X/Y}=M_X/M_Y\le M_X\le2-2^{-w_F}$; for $\sigma=2$ we have $M_X<M_Y$ with both on the $2^{-w_F}$ grid, hence $M_X\le M_Y-2^{-w_F}$ and $M_{X/Y}=2M_X/M_Y\le2-2^{-w_F+1}/M_Y<2-2^{-w_F}$ using $M_Y<2$. Either way the exact quotient is at most $2-2^{-w_F}$, the largest representable significand. Applying (11.3), $M_Q<M_{X/Y}+2^{-w_F-1}\le2-2^{-w_F-1}$, so $M_Q$ is never the top midpoint and the increment never carries out of the $w_F+1$ bits. No normalization, no exponent fix-up, no second binade. Compare [[Faithful Square Root Normalization Unit]], where $\sqrt{M_X^\mathrm{max}}$ sits a hair *below* the top midpoint and a faithful implementation is entitled to return $2.0$ — the same technique transposed to square root needs a normalization unit that division does not.

> [!note] What the last ulp costs
> A truncated multiplication, a comparison, a second rounding addition and some logic — **to buy one bit**. The book's own conclusion: for the same accuracy it is often cheaper to keep the faithful quotient in a format one bit wider. If the division is buried inside a larger circuit that is already being sized by an error budget ([[Error Analysis]], [[Error Accuracy]]), take the faithful quotient and spend the bit, not the hardware (p. 352).

$$\boxed{\;\mathrm{up}=\mathrm{LSB}(M_Q)\wedge\Big(\big[M_QM_Y\big]_{2^{-w_F}}\ne\big[\sigma M_X\big]_{2^{-w_F}}\Big),\qquad M_R=\Big\lfloor M_Q\Big\rfloor_{2^{-w_F}}+\mathrm{up}\cdot2^{-w_F}\;}$$

**When it breaks.**

- **A faithful quotient in the minimal format is not enough.** The technique needs $M_Q$ on the `ufix(0,`$-w_F-1$`)` grid *and* faithful to it. A divider whose bound is only $2^{-w_F}$ — faithful to the target format — puts the exact value anywhere in a full ulp, and the two-case argument collapses; there is nothing cheaper to do than round the wider quotient properly.
- **Ties reappear the moment the formats differ.** $\sigma M_X-M_QM_Y=0$ is impossible only when input and output significand formats are identical. In a mixed-precision divider (wider inputs, narrower output) the remainder can vanish and the block needs a real tie rule, which means knowing that the product is exactly equal rather than just its LSB — the one-XOR shortcut is the first thing to go.
- **Directed rounding is a different problem.** Round-up, round-down and round-to-zero must return an exactly representable quotient unmodified, and exactness is a null-remainder test over *all* the remainder bits inside the divider, not a single bit here (p. 350). This block only implements round-to-nearest.
- **The increment is a full carry propagation.** $+2^{-w_F}$ on $w_F+1$ bits is $\log_2 w_F$ deep, and it sits after a multiplier that is itself $\log$ deep — the "second rounding addition" the trade-off table charges for. As in the [[Floating-Point Rounding Adder]] it should be done on the concatenation $F_R\Vert E_R$ so a carry out of the significand updates the exponent for free, rather than as an isolated adder followed by a normalizer.
- **Half a multiplier is still a multiplier.** For binary64 the left-truncated $M_QM_Y$ is a $54\times53$-bit product with the upper triangle removed — on FPGAs that is still several DSP blocks, or a [[Compressor Trees|bit heap]] of comparable height to the divider's own inner loop. There is no width at which this becomes negligible.
- **It buys nothing if the consumer has an error budget.** A datapath sized by [[Error Analysis]] cannot tell a correctly rounded quotient from a faithful one; only a user-visible operator, or a requirement of bit-reproducibility across implementations, justifies the block.

**RTL (Spade).**

```spade
/// Correct rounding of a faithfully rounded quotient significand.
///   mq   : ufix(0,-WF-1) significand, faithful to the exact normalized quotient
///   mx,my: input significands, ufix(0,-WF)
///   sig2 : the divider's normalization decision, true when MX < MY (sigma = 2)
/// Returns the ufix(0,-WF) significand correctly rounded to nearest.
fn round_faithful_quotient<#uint WF>(
    mq: uint<{WF + 2}>,
    mx: uint<{WF + 1}>,
    my: uint<{WF + 1}>,
    sig2: bool,
) -> uint<{WF + 1}> {
    // left-truncated multiplier: `*.` keeps only the low WF+2 product columns,
    // whose MSB is the bit of weight 2^-WF of MQ*MY
    let myw: uint<{WF + 2}> = zext(my);
    let pbit: bool = (mq *. myw).msb();
    // bit of weight 2^-WF of sigma*MX: the LSB of MX, or 0 when sigma = 2
    let xbit: bool = if sig2 { false } else { mx.lsb() };
    let up: bool = mq.lsb() && (pbit != xbit);
    let qh: uint<{WF + 1}> = trunc(mq >> 1);
    if up { qh +. 1 } else { qh }
}
```

`mq >> 1` with the truncation is the diagram's *drop LSB* box — a pure rewiring, no gates. `mq *. myw` is the left-truncated multiplier: the truncating `*.` keeps $w_F+2$ of the $2w_F+4$ product bits, which is exactly the "only the low columns" argument above, and `.msb()` taps the single wire of weight $2^{-w_F}$. `pbit != xbit` is the XOR, `&&` the AND, and `qh +. 1` the $+2^{-w_F}$ incrementer. Everything is combinational. What synthesis does differently from both the drawing and the source: a real left-truncated multiplier drops the upper partial products *before* compression, whereas `*.` builds the full array and discards the high half afterwards — the emitted Verilog relies on the backend's cone-of-influence pruning to recover the saving, and on an FPGA that pruning does not extend into a hard DSP block, so the [[Compressor Trees|bit-heap]] form has to be written out by hand to get the area back.

Simulated at $w_F=8$ against a behavioural reference (exact rational quotient rounded to nearest, ties impossible): 3984 vectors passed with no failures — 15 named vectors including the extremal $M_X=511/256$ over $M_Y=1$, the $\sigma=2$ extremum $1$ over $511/256$, the deliberately asymmetric bit patterns `100000001` / `110000000` in both orders, and the exactly-representable quotients where only the truncated candidate is faithful; plus a random sweep in which each $(M_X,M_Y)$ pair is driven with both legal faithful approximations, $\lfloor M_{X/Y}\rfloor$ and $\lfloor M_{X/Y}\rfloor+1$ on the $2^{-w_F-1}$ grid. Inverting the XOR polarity fails 1970 of the same 3984, which confirms the midpoint branch is genuinely exercised rather than passing by way of the free case.

**Related Notes.**

- [[Floating-Point Divider]] – extends: this block bolts onto the baseline divider's faithful output in place of its rounding adder, and needs $\sigma$, which that divider already computes as $M_X<M_Y$.
- [[Truncated Multipliers]] – counter-example: same word, opposite triangle. Right truncation discards the low partial products and pays in error; left truncation discards the high ones and is exact.
- [[Left-Truncated Squarer]] – extends: the square-root transposition of this technique, deciding the sign of $S_0^2-X$ instead of $\sigma M_X-M_QM_Y$.
- [[Faithful Square Root Normalization Unit]] – compares: the overflow case that division provably cannot have and square root provably does, for the same faithful-plus-one-bit setup.
- [[Rounding]] – depends-on: the half-ulp neighbourhood definition that makes the LSB test in panel (a) a proof rather than a heuristic.
- [[Error Analysis]] – supports: the budget calculation that usually decides *against* building this block at all.
- [[Floating-Point Rounding Adder]] – supports: the $+2^{-w_F}$ increment should be the same significand-and-exponent concatenated addition used there, not a standalone adder.
- [[Choosing a Floating-Point Operator]] – compares: places the cost of this block against the faithful and baseline dividers.
- [[Floating-Point Multiplier]] – compares: the multiplier reaches correct rounding from an exact $(2w_F+2)$-bit product and one rounding adder, with no second multiplication anywhere — which is why the last ulp is cheap there and expensive here.

> [!warning] No area, delay or DSP figures exist for this block
> Chapter 11 reports no synthesis results at all — the only quantities it gives for §11.3.4 are the bit widths and the qualitative "much cheaper than directly attempting to compute a correctly rounded quotient" (p. 352). The claim that a left-truncated multiplier costs roughly half a full one is the standard partial-product-count argument, not a measurement from this book. Sizing the trade-off against simply widening the faithful quotient by one bit needs your own synthesis run.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 11 "Basic Floating-Point Operators".
  - Sect. 11.3.4, "Correct Rounding Out of a Faithfully Rounded Quotient" — eq. (11.3), the two LSB cases, the sign of $\sigma M_X-M_QM_Y$, the $|M_QM_Y-\sigma M_X|<2^{-w_F}$ bound and the left-truncated multiplier, **Fig. 11.9**, pp. 351–352.
  - Sect. 11.3.3, faithful floating-point division — the $|\delta_Q|<2^{-w_F-2}$ bound this block's input inherits, and the extremal quotients $1/2$ and $2-2^{-w_F}$, p. 351.
  - Sect. 11.3.1, baseline divider — $\sigma$ as the comparison $M_X<M_Y$, the merged $E_0-1+q_0$ exponent wire substitution, and the impossibility of ties, pp. 347–349; Sect. 11.3.2, directed rounding and the null-remainder sticky bit, p. 350.
  - Sect. 11.4.4, the square-root transposition and the left-truncated squarer, pp. 356–357; the closing "this last bit of accuracy may be quite expensive compared to faithful rounding", p. 357.
- [Mul+18] Muller et al., *Handbook of Floating-Point Arithmetic*, 2nd ed., Birkhäuser 2018 — lemma 4.13 (no ties in binary floating-point division), cited p. 349.
- [Din+10] de Dinechin, Joldeş, Pasca, Revy, "Multiplicative square root algorithms for FPGAs", *FPL* 2010 — the left-truncated squarer, cited p. 356.
- Long-form source: [[2.7) Floating-Point Operators]], sections "Floating-point division / Correct rounding out of a faithfully rounded quotient" and "Trade-offs".
