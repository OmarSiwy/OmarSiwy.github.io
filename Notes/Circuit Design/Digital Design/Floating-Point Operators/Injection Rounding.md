---
title: Injection Rounding
description: "Fuses the rounding adder into the multiplier by injecting the constant 2^(-wF-1) as one more bit-heap column, with a compound adder and a mux over the overflow bit covering the second binade. Two slow blocks become one."
kind: circuit
source: "ASA §11.2.4, pp. 346-347"
status: seed
spade: simulated
tags: [digital, floating-point-operators, rounding, multiplier, bit-heap]
aliases:
  - Injection rounding
  - Rounding injection
  - Injected rounding constant
  - Round-to-nearest by injection
---

# Injection Rounding

Round to nearest is implemented by adding a constant into the multiplier's own bit heap instead of after it, so that the rounding adder disappears from the critical path and only a compound adder and a multiplexer remain.

```tikz title="Injection-rounded significand path of a floating-point multiplier"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- inputs -------------------------------------------------------------
  \node[anchor=south] at (-1.9,6.15) {$M_X$};
  \node[anchor=south] at ( 1.9,6.15) {$M_Y$};
  \node[anchor=west]  at (-1.8,5.85) {\scriptsize $w_F{+}1$};
  \node[anchor=west]  at ( 2.0,5.85) {\scriptsize $w_F{+}1$};
  \draw[->,>=latex] (-1.9,6.1) -- (-1.9,5.45);
  \draw[->,>=latex] ( 1.9,6.1) -- ( 1.9,5.45);

  % ---- bit heap -----------------------------------------------------------
  \node[draw,minimum width=7.2cm,minimum height=0.9cm] (heap) at (0,5.0)
        {partial-product bit heap of $M_XM_Y$};
  \node[anchor=south] at (5.0,6.05) {\scriptsize injection: one extra column, $2^{-w_F-1}$};
  \draw[->,>=latex] (5.0,6.0) -- (5.0,5.0) -- (3.65,5.0);

  % ---- compressor tree ----------------------------------------------------
  \draw[->,>=latex] (0,4.55) -- (0,4.05);
  \node[draw,minimum width=7.2cm,minimum height=0.9cm] (tree) at (0,3.6)
        {compressor tree ($\log_2 w_F$ depth)};

  % ---- carry-save split ---------------------------------------------------
  \draw[->,>=latex] (-2.4,3.15) -- (-2.4,2.35);
  \draw[->,>=latex] (-1.2,3.15) -- (-1.2,2.35);
  \node[anchor=east] at (-2.5,2.75) {\scriptsize $C_h$};
  \node[anchor=west] at (-1.1,2.75) {\scriptsize $S_h$};
  \node[anchor=west] at (-3.4,2.05) {\scriptsize $w_F{+}3$ high columns};

  \draw[->,>=latex,dashed] (2.2,3.15) -- (2.2,2.35);
  \node[anchor=west] at (2.35,2.75) {\scriptsize $C_\ell,S_\ell$ discarded};
  \node[anchor=north] at (2.2,2.3) {\scriptsize $w_F{-}1$ low columns};

  % ---- compound adder -----------------------------------------------------
  \node[draw,minimum width=3.6cm,minimum height=0.9cm] (cadd) at (-1.8,1.35)
        {compound adder};
  \draw[->,>=latex] (-2.7,0.9) -- (-2.7,0.15);
  \draw[->,>=latex] (-0.9,0.9) -- (-0.9,0.15);
  \node[anchor=east] at (-2.8,0.5) {\scriptsize $T=C_h{+}S_h$};
  \node[anchor=west] at (-0.8,0.5) {\scriptsize $T{+}1$};

  % ---- mux ----------------------------------------------------------------
  \draw (-3.3,0.15) -- (-0.3,0.15) -- (-0.7,-0.55) -- (-2.9,-0.55) -- cycle;
  \node at (-1.8,-0.2) {mux};
  \node[anchor=south] at (1.1,-0.15) {\scriptsize $\mathrm{ovf}=\mathrm{msb}(T)$};
  \draw[->,>=latex] (2.6,-0.2) -- (-0.4,-0.2);
  \draw (2.6,0.5) -- (2.6,-0.2);
  \draw[->,>=latex] (2.6,0.5) -- (2.6,1.1);
  \node[anchor=west] at (2.7,1.1) {\scriptsize to exponent: $E_X{+}E_Y{-}E_0{+}\mathrm{ovf}$};

  % ---- output -------------------------------------------------------------
  \draw[->,>=latex] (-1.8,-0.55) -- (-1.8,-1.3);
  \node[anchor=east] at (-1.9,-0.95) {\scriptsize $w_F{+}1$};
  \node[anchor=north] at (-1.8,-1.3) {rounded significand, $\mathrm{ufix}(0,-w_F)$};
  \node[anchor=west] at (-1.6,-0.95) {\scriptsize $T\!\gg\!1$ or $(T{+}1)\!\gg\!2$};
\end{circuitikz}
\end{document}
```

*Own construction; the blocks it replaces are Fig. 11.7, p. 344.*

**Name the two serial log-depth blocks the technique attacks.** The baseline [[Floating-Point Multiplier]] puts a $(w_F{+}1)\times(w_F{+}1)$ significand multiplier and a rounding adder back to back. Both are $\log_2 w_F$-deep: the multiplier because its [[Compressor Trees|compressor tree]] is, the [[Floating-Point Rounding Adder|rounding adder]] because a carry must propagate across $w_F{+}1$ bits. Two such blocks in series is the whole significand latency, and neither is removable by making the other smaller. Injection rounding removes the second one by folding its work into the first.

**Turn round-to-nearest into a truncation.** Let $p>0$ and let $\lfloor\cdot\rfloor_{w_F}$ denote truncation to a multiple of $2^{-w_F}$. Write $p=m2^{-w_F}+r$ with $m\in\mathbb{N}$ and $0\le r<2^{-w_F}$ — this is just the division algorithm applied at scale $2^{-w_F}$. Then, because truncation is additive on the integer part,

$$
\big\lfloor p+2^{-w_F-1}\big\rfloor_{w_F}=\big\lfloor m2^{-w_F}+(r+2^{-w_F-1})\big\rfloor_{w_F}=
\begin{cases}m2^{-w_F}, & r<2^{-w_F-1}\\[2pt] (m+1)2^{-w_F}, & r\ge 2^{-w_F-1}\end{cases}
$$

which is exactly "round up iff the discarded part is at least half an ulp, ties up". For a positive significand — and $M_XM_Y$ is always positive, the sign lives on a separate wire — ties up *is* ties away. So a **constant addend before truncation implements round to nearest**, and truncation itself is free: it is the choice of which wires to keep. See [[Rounding]] for the mode taxonomy and [[Number Formats]] for the ulp convention.

**Make the constant free by putting it in the heap.** $P=M_XM_Y$ is a $(2w_F{+}2)$-bit `ufix(1,`$-2w_F$`)` number in $[1,4)$, formed as a sum of weighted partial-product bits ([[Bit Heaps]]). A constant $2^{-w_F-1}$ is one more bit in the column of weight $-w_F-1$. A compressor tree's depth is $\log_{3/2}$ of the *maximum column height*, so one extra bit in one column changes the depth by nothing at all in the overwhelming majority of cases — it is absorbed into a reduction that was going to happen anyway. Set $P'=P+2^{-w_F-1}$; no width growth, because $P\le 4-4\cdot2^{-w_F}+2^{-2w_F}$ and adding $2^{-w_F-1}$ leaves $P'<4$.

**Handle the second binade, where the injected constant is half of what it should be.** When $P'\in[1,2)$ the result ulp is $2^{-w_F}$ and dropping the lower half of $P'$ *is* the correctly rounded product. When $P'\in[2,4)$ the significand is normalized by a $1$-bit right shift, so the result ulp measured on $P'$ is $2^{-w_F+1}$ and round to nearest wanted an injection of $2^{-w_F}=2\times2^{-w_F-1}$ — the rounding bit belonged one position to the left. Equivalently, a **second bit of the same weight $2^{-w_F-1}$**, the *correction bit*. Adding it with a second adder would reinstate exactly the delay the technique was built to remove.

**Get the correction bit for free out of a compound adder.** $P'$ leaves the compressor tree in carry-save form $(C,S)$, two $(2w_F{+}2)$-bit vectors, and still needs a fast adder to be resolved. Make that adder a **compound adder** ([[Carry-Select Adder]]), which produces $C+S$ and $C+S+1$ simultaneously at the cost of one prefix tree plus a row of muxes rather than two additions. Only the leading $w_F+3$ columns survive — weights $2^{1}$ down to $2^{-w_F-1}$, the rest being discarded by the truncation — so the compound adder's $+1$ sits at weight $2^{-w_F-1}$ and *is* the correction bit. Call the resolved leading half $T$. Its MSB, at weight $2^1$, is the overflow bit $\mathrm{ovf}$, and a multiplexer selects $T\gg1$ when $\mathrm{ovf}=0$ and $(T+1)\gg2$ when $\mathrm{ovf}=1$, both yielding $w_F+1$ bits in `ufix(0,`$-w_F$`)`. The same $\mathrm{ovf}$ drives the exponent mux that was already there in the baseline. Two slow blocks became one.

> [!note] The rounding-overflow case falls out for free
> The baseline needs $E_X{+}E_Y{-}E_0{+}1$ in two situations: $P\in[2,4)$, and $P\in[1,2)$ whose rounding carries the fraction to all zeros. Injection rounding merges them, because the injected constant is added *before* the binade is tested: a $P<2$ that rounds up to $2$ has $P'\ge2$ by construction, so it takes the $[2,4)$ branch and comes out as $1.0\ldots0$ with the incremented exponent. One overflow bit covers both. The exclusivity argument of p. 345 — a normalized product can never round up into the next binade, since $(2-2^{-w_F})^2/2=2-2^{-w_F+1}+2^{-2w_F-1}<2-2^{-w_F}$ — is what makes the single test sound.

**Read the FPGA case as the best one.** The technique is a natural fit for a bit-heap-centric flow: the injected constant is one more column in a heap that will be compressed anyway, and the compound adder maps onto the same hard carry chain as the plain one — the second output costs a row of LUTs, not a second carry chain traversal. On ASIC the compound adder is a genuine area addition over a plain prefix adder, so the trade is delay for area rather than delay for nearly nothing. Nothing about the rest of Fig. 11.7 changes; a [[Faithful Floating-Point Multiplier]] can be injection-rounded too, since the error budget closes on $P$ before rounding is applied.

$$\boxed{\ \big\lfloor p+2^{-w_F-1}\big\rfloor_{w_F}=\mathrm{RN}_{\text{ties away}}(p)\ ,\qquad R=\begin{cases}T\gg 1,&\mathrm{ovf}=0\\[2pt](T+1)\gg 2,&\mathrm{ovf}=1\end{cases}\ }$$

**When it breaks.**

- **Ties to even.** The identity above delivers ties *away*, and there is no constant whose injection gives ties to even — the tie direction depends on the parity of $m$. Recovering ties to even means detecting the exact-midpoint case (an OR tree over the discarded columns of $P$, not of $P'$) and clearing the result LSB, which is cheap but is extra logic that plain injection does not have. [Mul+18] treats the other rounding modes and subnormals in full; this chapter does not.
- **Directed rounding.** Round toward $-\infty$ or $+\infty$ needs a different constant per sign and a sticky, so the "one constant, no adder" story does not survive.
- **Signed operands.** The derivation assumes $p>0$. It is fine here because the multiplier works on magnitudes, but injecting into a two's-complement heap rounds *toward $+\infty$* on negatives, not to nearest away.
- **When the rounding adder was not on the critical path.** In a deeply pipelined multiplier where the rounding adder occupies a stage that had slack anyway, the compound adder buys nothing and costs area.
- **Small $w_F$.** At $w_F\lesssim 8$ the multiplier is one or two DSP blocks and the "$\log_2 w_F$-deep tree" is not a tree; the two-slow-blocks framing that motivates the technique stops describing the hardware.

> [!warning] The carry out of the discarded columns is left implicit in the source
> The book says the fast adder completes $C+S$ "only for the leading half of $P'$, since the lower bits will be discarded" (p. 347). But the carry generated *inside* those $w_F-1$ discarded columns has weight $2^{-w_F-1}$ and must still reach the leading half — dropping it costs a full ulp of $T$, i.e. half an ulp of the result, which is precisely the accuracy the injection was buying. A real implementation must either widen the compound adder to cover the low columns or resolve their carry-out separately. The RTL below adds full width and so is exact; the text gives no guidance on the cheaper option.

## RTL (Spade)

```spade
/// Injection-rounded significand path of a floating-point multiplier.
/// Inputs are normalized significands in ufix(0,-WF), i.e. value in [1,2)
/// scaled by 2^WF. Returns (rounded significand, exponent increment).
fn inject_round<#uint WF>(mx: uint<{WF + 1}>, my: uint<{WF + 1}>) -> (uint<{WF + 1}>, bool) {
    // P = Mx*My, ufix(1,-2WF), 2WF+2 bits, value in [1,4)
    let p: uint<{2 * WF + 2}> = mx * my;
    // the injected constant 2^(-WF-1): one extra bit-heap column
    let inj: uint<{2 * WF + 2}> = 1 << (WF - 1);
    let pp: uint<{2 * WF + 2}> = p +. inj;             // P', cannot reach 4
    // leading half of P': weights 2^1 down to 2^(-WF-1)
    let t: uint<{WF + 3}> = trunc(pp >> (WF - 1));
    // compound adder: T and T+1 available together; the +1 is the correction bit
    let t1: uint<{WF + 3}> = t +. 1;
    if t.msb() {                                        // ovf: P' in [2,4)
        (trunc(t1 >> 2), true)
    } else {
        (trunc(t >> 1), false)
    }
}
```

`p` is the compressor tree's output resolved to a single vector; `inj` is the injected column and `pp` the heap after it. `t` is the $(w_F{+}3)$-bit leading half that reaches the compound adder, whose two outputs are `t` and `t1`; `t.msb()` is the overflow bit driving both the significand mux and the exponent increment. Everything is combinational — the pipeline registers of a real operator go between the tree and the compound adder. Synthesis will *not* build this as written: the `mx * my` then `+.` then `>>` sequence describes one resolved addition, whereas the point of the architecture is that `inj` enters the heap before compression and the shifts are wiring; and only one of `t`/`t1` would be computed by a plain synthesizer, so the compound adder must be instantiated structurally to exist at all.

Simulated against an independent behavioural model that rounds first and detects fraction overflow second, at $w_F=4$: 5 named vectors (including the asymmetric $17\times30$, which is the $P\in[1,2)$ case that rounds up into the next binade), all 256 normalized significand pairs exhaustively, and 3000 random vectors — 0 mismatches.

## Related Notes

- [[Floating-Point Multiplier]] – extends: this is the baseline of Fig. 11.7 with its rounding adder removed; everything else in that architecture is unchanged.
- [[Floating-Point Rounding Adder]] – compares: the block injection rounding exists to delete, and the one to keep when the critical path has slack.
- [[Bit Heaps]] – depends-on: the injected constant is only free because the operator was already a heap.
- [[Compressor Trees]] – depends-on: one extra bit in one column is absorbed by a reduction that was happening anyway.
- [[Carry-Select Adder]] – supports: supplies $C+S$ and $C+S+1$ together, which is what makes the correction bit cost nothing.
- [[Rounding]] – compares: places ties-away against the modes injection cannot reach with a single constant.
- [[Faithful Floating-Point Multiplier]] – compares: the other way to make the multiplier cheaper, by relaxing accuracy instead of restructuring the rounding.
- [[Correct Rounding from Faithful Quotient]] – counter-example: division reaches correct rounding by adding a comparison and a second rounding addition, the opposite trade.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024
  - Sect. 11.2.4 "Injection Rounding to Speed Up a Floating-Point Multiplier", pp. 346–347 — the injection identity, the correction bit, the compound adder and the overflow mux
  - Sect. 11.2.1 baseline multiplier, Fig. 11.7 and the exponent-mux exclusivity argument, pp. 343–345
  - Sect. 11.2.3 faithful multiplier, p. 346; Sect. 11.3.3, p. 351 — injection rounding reused to fuse the rounding adder into a reciprocal-based divider
- [Mul+18] Muller et al., *Handbook of Floating-Point Arithmetic*, 2nd ed., Birkhäuser 2018 — injection rounding for the remaining rounding modes and for subnormals; cited p. 347.
