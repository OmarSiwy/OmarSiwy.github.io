---
title: Shift by Multiplier
description: "A left shift is a multiply by 2^S, so one-hot encode S in logic and feed a DSP block; faster and cheaper than a logic shifter whenever a DSP is idle, as in some AMD floating-point adder cores."
kind: circuit
source: "ASA §10.4, p. 325"
status: seed
spade: simulated
tags: [digital, shifters, fpga, dsp, multiplier]
aliases:
  - DSP Shifter
  - DSP-Based Shifter
  - Multiplier-Based Shifter
  - Shift by Multiplication
---

# Shift by Multiplier

A shifter built from a hard multiplier: one-hot encode the shift distance into $Y=2^S$ and multiply, so the entire barrel of multiplexers disappears into a DSP block that was already fabricated whether you use it or not.

```tikz title="Shift by multiplier: one-hot decoder feeding a DSP hard multiplier"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[
  font=\footnotesize, >=latex, line width=0.5pt,
  blk/.style={draw,rounded corners=1.5pt,minimum width=30mm,minimum height=8mm,inner sep=2pt},
  mm/.style={draw,rounded corners=1.5pt,minimum width=22mm,minimum height=8mm,inner sep=2pt},
  w/.style={font=\scriptsize,inner sep=1.3pt}
]
\node at (-2.8,5.0) {$X$};
\node at ( 2.8,5.0) {$S$};

\draw[->] (2.8,4.75) -- node[w,right]{$w_S=\lceil\log_2(S_{\max}{+}1)\rceil$} (2.8,4.05);
\node[blk] (dec) at (2.8,3.65) {one-hot decode $2^S$};
\node[w,anchor=west] at (4.45,3.65) {$S_{\max}{+}1$ LUTs, one level};
\draw (2.8,3.25) -- node[w,right,pos=0.55]{$Y$, $S_{\max}{+}1$ bits} (2.8,1.3);
\draw[->] (2.8,1.3) -- (1.1,1.3);
\draw (-2.8,4.75) -- node[w,left,pos=0.72]{$w_X$} (-2.8,1.3);
\draw[->] (-2.8,1.3) -- (-1.1,1.3);

\draw[dashed,rounded corners=3pt] (-1.9,0.7) rectangle (1.9,1.9);
\node[mm] (mul) at (0,1.3) {$\times$};
\node[w,anchor=north east,align=right] at (-2.0,0.65) {DSP block:\\ hard multiplier};
\node[w,anchor=north west,align=left] at (2.0,0.65) {exactly one non-zero\\ partial-product row};

\draw[->] (0,0.7) -- node[w,right]{$w_X+S_{\max}$} (0,-0.55);
\node at (0,-0.85) {$R = X\cdot 2^S = X \ll S$};

\node[w,anchor=west,align=left] at (4.45,2.6) {$Y$ is all zeroes except\\ a single 1 at index $S$};
\node[w,anchor=east,align=right] at (-4.45,2.6) {exact full shift:\\ no bit of $X$\\ is ever discarded};
\end{circuitikz}
\end{document}
```

**Read the shift as an arithmetic identity rather than as routing.** In a positional number system a left shift by one multiplies every weight $2^i$ by $2$, so by the definition of positional weight,

$$X \ll S \;=\; X \cdot 2^{S}$$

exactly, over $\mathbb{N}$ ([[Number Formats]]). This is the same monoid homomorphism $\sigma^a\circ\sigma^b=\sigma^{a+b}$ that [[Shifters]] uses, read in the opposite direction: instead of *decomposing* $\sigma^S$ into $w_S$ factors and spending one multiplexer row per factor, evaluate the exponential $2^S$ once and hand the whole problem to a multiplier. Widths: $X$ on $w_X$ bits, $S$ on $w_S=\lceil\log_2(S_{\max}+1)\rceil$ bits, $Y=2^S$ on $S_{\max}+1$ bits, and the product $R$ on $w_X+S_{\max}$ bits — which is exactly the width of an [[Exact Full Shifter]], so no bit of $X$ is ever discarded and the operator is $0$ ulp.

**The exponential is a decoder, and a decoder is one LUT level.** $Y=2^S$ is the one-hot encoding of $S$: bit $y_k$ of $Y$ is $1$ iff $S=k$, so

$$y_k \;=\; \bigwedge_{j=0}^{w_S-1}\big(s_j \equiv k_j\big) \;=\; \bigwedge_{j=0}^{w_S-1} \big(s_j \text{ if } k_j{=}1 \text{ else } \overline{s_j}\big)$$

which is a **single minterm** of $S$ — one $w_S$-input AND gate per output bit, no sharing needed and none possible. Since a 6-input LUT realises any Boolean function of up to 6 inputs, every $y_k$ costs exactly one LUT for $S_{\max}\le63$, and the whole decoder is $S_{\max}+1$ LUTs at **depth one** ([[FPGAs]]). There is no carry chain, no cascade and no fanout problem on the decoder side; the fanout lands instead on $S$, which drives $S_{\max}+1$ LUT inputs, and on the DSP's $Y$ port.

> [!important] The multiply *is* the one-hot shifter, cast in silicon you already own
> An unsigned $w_X\times(S_{\max}{+}1)$ multiplier forms the partial products $x_i y_k$ at weight $2^{i+k}$ and sums them. With $Y$ one-hot, exactly one row $x_i y_S = x_i$ survives and every other row is identically zero, so the summation tree adds nothing but zeroes and the result is $X$ re-aligned to weight $2^S$. That AND-array-plus-reduction is *literally* the [[One-Hot Shifter]] — $w_X(S_{\max}+1)$ AND gates and an OR reduction, the architecture the [[Choosing a Shifter|trade-off table]] rejects as quadratic. The quadratic area is only fatal when you pay for it in LUTs. Inside a DSP block the array is hard-wired silicon that exists on the die whether or not your design instantiates it, so its area cost to you is zero and its delay is one hard multiplier delay instead of $\lceil\log_2(S_{\max}+1)\rceil$ multiplexer levels.

**Count what you actually spend.** Take $w_X=16$, $S_{\max}=15$, $w_S=4$, and price both alternatives in LUT6, using the merge rule that two 2:1 multiplexer rows collapse into one row of 4:1 LUTs ([[Barrel Shifters]], p. 314):

| Implementation | LUT6 | Logic depth | DSPs | Output |
| --- | --- | --- | --- | --- |
| Barrel shifter (truncated to $w_X$) | $\tfrac12 w_X\log_2(S_{\max}{+}1)=32$ | 2 | 0 | 16 bits |
| Exact full shifter, LSB-first | $\tfrac12(17{+}19{+}23{+}31)=45$ | 2 | 0 | 31 bits |
| Shift by multiplier | $S_{\max}{+}1=16$ | 1 LUT + 1 DSP | 1 | 31 bits |

The DSP row wins on both axes against the architecture that is *more* favourable to logic — half the LUTs of the truncated barrel shifter, and it still delivers the exact 31-bit result. The gap widens with $w_X$, because logic cost grows as $w_X\log_2 S_{\max}$ while the decoder cost grows as $S_{\max}$ alone and is independent of $w_X$: at $w_X=24$, $S_{\max}=25$ the barrel shifter needs 60 LUT6 against 26 for the decoder. This is the sense in which the book calls it "much faster and cheaper than a complete shifter" (p. 325).

**Right shifts come free from biasing, not from a second circuit.** A multiplier only shifts left; a right shift would need a divider. The fix is the standard [[Bidirectional Shifter]] manoeuvre — shift *left* by $S_{\max}-S$ starting from the rightmost possible position, then read the top $w_R$ bits — and here the constant offset costs literally nothing, because $S$ is already passing through a decoder: decoding $2^{S_{\max}-S}$ instead of $2^{S}$ means relabelling output $k$ of the decoder as output $S_{\max}-k$, which is a permutation of wires and free by the same argument that makes a hardwired shift free. The subtraction never happens.

**The DSP's fixed geometry, not exactness, is the binding constraint.** The two operands must fit the hard multiplier's ports, and $Y$ needs $S_{\max}+1$ bits — the one-hot encoding is *exponentially* wider than $S$ itself, which is what stops this scaling. On UltraScale(+) the unit is $18\times27$ **signed**, so tying each MSB to zero gives $17\times26$ unsigned ([[DSP Blocks]], Table 4.1, p. 95). Assigning the wider port to whichever of $X$ and $Y$ needs it:

$$\min(w_X,\,S_{\max}{+}1)\le 17 \quad\wedge\quad \max(w_X,\,S_{\max}{+}1)\le 26$$

so $w_X\le26$ buys $S_{\max}\le16$, and $w_X\le17$ buys $S_{\max}\le25$. The 48-bit output is never the limit: it covers $w_X+S_{\max}\le43$, far beyond what the input ports admit. Intel's single-multiplier $27\times27$ mode is documented unsigned and relaxes both bounds symmetrically to 26 bits (Table 4.1, p. 95). Beyond those widths you are tiling several DSPs into one wide multiplier ([[Multipliers]]), at which point the logic shifter is cheaper again.

> [!warning] Which AMD core, in which configuration, is not in the source
> The book states only that "some AMD cores for floating-point addition may consume DSP blocks", citing the LogiCORE Floating-Point Operator product guide [Xil19] (p. 325). It gives no operand mapping, no $S_{\max}$, and no measured area or delay for a DSP-based shifter. The widths above are derived here from Table 4.1's port geometry, not quoted; the single-precision alignment case ($w_X=w_F+1=24$, $S_{\max}=w_F+3=26$, hence a 27-bit $Y$) does **not** fit one UltraScale unit under that derivation, so the real core must either clamp $S_{\max}$, split across DSPs, or shift a narrower field. Needs outside research.

**Rounding support is where the trick gives some of it back.** The product is the exact full shift, so nothing is lost — but that also means nothing has been *summarised*. If the consumer only takes the top $w_R$ bits, the sticky bit $\sigma=\bigvee\{\text{discarded low bits of } R\}$ is a wide OR sitting **after** the DSP, strictly in series with it, exactly the naive placement that [[Shifter with Sticky Bit Computation]] exists to avoid by folding the OR into the multiplexer stages it overlaps. On FPGA a wide OR maps onto the fast carry chain rather than an OR tree, so its area is negligible and its delay is well below $\log$ of its width (p. 315) — but it is added latency the barrel version does not pay at all, and it eats into the win whenever the shifter feeds a correctly-rounded operator ([[Rounding]], [[Error Accuracy]]).

**Treat this as resource allocation, not architecture.** Nothing about the circuit is better; the multiplier-based shifter is the asymptotically worst shifter architecture there is. What changes is the currency. A DSP block is free until the design runs out of them, and then it is the most expensive resource on the chip — the same cliff that governs [[Multiplication by Constants]] and every decision in [[Multipliers]]. So the rule is: use it when a DSP is idle *and* the widths fit, and re-check the moment the DSP utilisation report crosses about 80%. The optional input and output registers inside the block are also already paid for, so pipelining this shifter to the DSP's native latency costs no fabric flip-flops, which a LUT-based barrel shifter cannot say.

$$\boxed{\ R = X \ll S = X \times 2^{S},\qquad \text{cost} = 1\ \text{DSP} + (S_{\max}{+}1)\ \text{LUTs at depth }1\ }$$

**When it breaks.**

- $S_{\max}+1 > $ the DSP's operand width. The one-hot $Y$ grows *exponentially* in $w_S$, so every extra bit of shift range doubles the port requirement; past $S_{\max}\approx25$ on a single unit the trick simply stops fitting, and IEEE double alignment ($S_{\max}=54$) is nowhere near.
- No DSP is idle. Then the multiplier is built from LUTs, and a LUT-based multiplier by a one-hot operand is the quadratic [[One-Hot Shifter]] — strictly worse than the barrel shifter you were trying to avoid. Synthesis will do this silently if the DSP inference threshold is not met; check the resource report, do not assume.
- The consumer needs a sticky bit. The wide OR is serial after the DSP; a reversed-order barrel shifter with early sticky computes it for free inside stages that were being paid for anyway.
- The shift is arithmetic (sign-extending) rather than logical. Signed $X$ works — a signed$\times$positive product left-shifts a two's-complement value correctly — but the *right*-shift-by-bias form then needs sign extension of the biased operand, and a signed port loses one bit of usable width on AMD parts.
- Only a handful of distinct distances are ever used. A [[Sporadic Shifter]] optimised against that discrete set beats both, in LUTs and in DSPs.
- $X$ is constant. Then no shifter of any kind is right: tabulate every shifted value in a block RAM addressed by $S$ (p. 325).

```spade
/// Left shift by multiplication: R = X * 2^S, exact on W + Smax bits.
/// `one << s` is a *decoder*, not a shifter: the shifted operand is the
/// constant 1, so every output bit collapses to one minterm of `s`.
fn shift_by_mul<#uint W, #uint WS>(x: uint<W>, s: uint<WS>) -> uint<{2 * W}> {
    let one: uint<W> = 1;
    let hot = one << zext::<WS, W>(s);
    x * hot
}
```

`hot` is the decoder box in the diagram and `x * hot` is the dashed DSP box; the whole entity is combinational, with no clock, because the DSP's pipeline registers are an implementation choice made at mapping time rather than part of the arithmetic. Width arithmetic: Spade's `*` returns $2W$ bits where the exact full shift only needs $W+S_{\max}=2W-1$, so the product's MSB is provably always zero — a ceiling of the operator's typing rule, not of the circuit. The one thing synthesis will do differently from the drawing is decide whether this becomes a DSP at all: with `W = 16` it fits an UltraScale unit comfortably, but a tool below its DSP inference threshold will expand it into a LUT array multiplier instead, which is the failure mode listed above.

## Related Notes

- [[DSP Blocks]] – depends-on: the hard multiplier this note offloads onto, and the port widths in Table 4.1 that decide whether it fits at all.
- [[One-Hot Shifter]] – extends: the same AND-array architecture, priced in LUTs instead of in hard silicon; this note is that circuit relocated.
- [[Barrel Shifters]] – compares: the default logarithmic-depth alternative, and the LUT count the DSP version has to beat.
- [[Exact Full Shifter]] – supports: the product width $w_X+S_{\max}$ is precisely this note's output specification, obtained for free.
- [[Bidirectional Shifter]] – supports: supplies the bias that turns the multiplier's left-only shift into a right shift, here at zero cost.
- [[Shifter with Sticky Bit Computation]] – counter-example: gets the sticky bit inside the stages, which the DSP form structurally cannot.
- [[Multipliers]] – depends-on: the partial-product array whose degenerate one-hot case this is.
- [[Multiplication by Constants]] – compares: the mirror-image specialisation, where the *multiplier* is fixed and the multiplicand varies.
- [[Sporadic Shifter]] – compares: wins instead when only a discrete subset of distances is required.
- [[Choosing a Shifter]] – compares: where this sits once DSP availability enters the cost function.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §10.4 To read further, p. 325 — shift as multiplication by a power of two, one-hot encoding of $S$ in FPGA logic, AMD floating-point addition cores [Xil19], sporadic shifters [Che+18], tabulated shifts of constant $X$ [LP13].
- §10.1.4 Barrel shifter, pp. 314–315 — mux counts, 6-LUT merging of two mux levels, wide ORs on the fast carry chain.
- §10.1.3 Exact full shifter, pp. 312–313 — output width $w_X+S_{\max}$, LSB-first stage widths.
- §4.2 DSP blocks, pp. 94–95 — eq. 4.4, Table 4.1 operand widths, signed-versus-unsigned width loss.
