---
title: "Faithful Shift-and-Add Real Constant Multiplier"
description: "Splits one ulp between the final rounding and the constant's own truncation error, which fixes how many bits of pi you actually have to build."
kind: circuit
source: "ASA §12.3.2, pp. 386-389"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, faithful-rounding, fixed-point, fpga]
aliases:
  - Faithful Fix-by-Real Shift-and-Add
  - Fix-by-Real Shift-and-Add
  - Faithful Real Constant Multiplier
---

# Faithful Shift-and-Add Real Constant Multiplier

An adder graph for a *finite-precision surrogate* $\widetilde C$ of a real constant $C$, sized so that the surrogate's error and the output rounding error together stay inside one ulp.

```tikz title="Generic faithful fix-by-real architecture, and the interval of admissible constants"
\usepackage{circuitikz}
\usetikzlibrary{arrows}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]
  % ---- (a) generic faithful fix-by-real architecture ----
  \node (x) at (0,5.0) {$X$};
  \node[draw, minimum width=4.2cm, minimum height=0.9cm] (cm) at (0,3.6)
       {shift-and-add graph for $\widetilde C$};
  \node[draw, minimum width=2.6cm, minimum height=0.7cm] (fr) at (0,1.7)
       {final round to $\ell_R$};
  \node (r) at (0,0.5) {$R(X)$};
  \draw[->] (x) -- (cm);
  \draw[->] (cm) -- (fr);
  \draw[->] (fr) -- (r);
  \node[anchor=west] at (0.12,4.35) {$(m_X,\ell_X)$, $w_X$ bits, $|X|\le X_{\max}$};
  \node[anchor=west] at (0.12,2.75) {$P(X)=\widetilde C X$ exact, $(m_P,\ell_P)$};
  \node[anchor=west] at (0.12,1.10) {$(m_R,\ell_R)$, $\mathrm{ulp}=2^{\ell_R}$};
  \node[anchor=east] at (-2.2,2.75) {injects $\delta_C X=(\widetilde C-C)X$};
  \node[anchor=east] at (-1.4,1.70) {injects $\delta_{\text{final round}}$};
  \node at (0,-0.35) {(a) two error sources, one ulp of budget between them};

  % ---- (b) the admissible interval for Ctilde ----
  \begin{scope}[yshift=-3.5cm]
    \draw[->] (-4.4,0) -- (4.6,0);
    \foreach \i in {-9,-8,...,9} \draw (0.42*\i,-0.10) -- (0.42*\i,0.10);
    \draw[thick] (-2.10,-0.32) -- (-2.10,0.32);
    \draw[thick] ( 2.10,-0.32) -- ( 2.10,0.32);
    \node[anchor=south] at (-2.10,0.34) {$C-\overline\delta_C$};
    \node[anchor=south] at ( 2.10,0.34) {$C+\overline\delta_C$};
    \draw[thick] (-0.17,0) -- (-0.17,0.34);
    \draw[thick] (0,0) -- (0,0.80);
    \draw (-0.17,0.34) -- (-0.80,0.72);
    \node[anchor=east] at (-0.82,0.73) {$C$};
    \node[anchor=south] at (0,0.82) {$\lfloor C\rceil_{\ell_{\max}}$};
    \node[anchor=north east] at (-2.6,-0.18) {ticks: multiples of $2^{\ell_{\max}}$};
    \foreach \i in {-4,-3,...,4} \draw[->] (0.22*\i,-1.30) -- (0.42*\i,-0.16);
    \node[anchor=north] at (0,-1.36) {possible $\widetilde C$ at $\ell=\ell_{\max}-k$};
    \node at (0,-2.25) {(b) faithfulness admits an interval, not a point};
  \end{scope}
\end{circuitikz}
\end{document}
```

*after Fig. 12.13, p. 388 and Fig. 12.14, p. 389.*

**Make "where to stop" an input to the problem.** When $C$ is an integer the product $CX$ is exact and its width follows from $C$ and $w_X$. When $C\in\mathbb R$ — $\pi$, $1/\log 2$, an FFT twiddle $\cos\frac{k\pi}{n}$, a raised-cosine FIR tap — the exact product has infinitely many bits, so the generator gains an argument it did not need before: the output LSB $\ell_R$ (Fig. 12.11, p. 386). The input stays fixed-point, $\mathrm{ufix}(m_X,\ell_X)$ or $\mathrm{sfix}(m_X,\ell_X)$ with $w_X=m_X-\ell_X+1$ bits; format conventions are in [[Fixed-Point Representations]]. Everything below is the consequence of one design decision: the operator is only asked to be *faithful*, $|\delta_{\text{total}}|<2^{\ell_R}$, not correctly rounded.

**Split the error by telescoping through the exact surrogate product.** A shift-and-add graph can realize only a finite-precision $\widetilde C$, so write $P(X)=\widetilde CX$ for the graph's exact output — exact because fixed-point addition of exactly representable terms is errorless — and $R(X)$ for the rounded result. Insert and cancel $P(X)$:

$$\delta_{\text{total}}(X)=R(X)-CX=\underbrace{\big(R(X)-P(X)\big)}_{\delta_{\text{final round}}}+\underbrace{(\widetilde C-C)}_{\delta_C}X \tag{12.16–12.19, p.\,388}$$

Two terms, two mechanisms, and they are structurally different: $\delta_{\text{final round}}$ is bounded by construction at $|\delta_{\text{final round}}|\le2^{\ell_R-1}$ because rounding to nearest at LSB $\ell_R$ can err by at most half an ulp ([[Rounding]]), while $\delta_CX$ *grows with the input*.

**Turn the remaining half-ulp into a bound on the constant alone.** Faithfulness is $|\delta_{\text{total}}|<2^{\ell_R}$, so after spending $2^{\ell_R-1}$ on the final round the constant's contribution may consume the other half:

$$\forall X,\quad|\delta_CX|<2^{\ell_R-1}\quad\Longrightarrow\quad|\delta_C|<\overline\delta_C=\frac{2^{\ell_R-1}}{X_{\max}} \tag{12.21–12.22, p.\,388}$$

The quantification over all $X$ is discharged by monotonicity of $|\delta_C X|$ in $|X|$: bounding at the extreme $X_{\max}$ bounds everywhere. That is the entire accuracy analysis, and the input format enters it through exactly one number, $X_{\max}$ — not through $w_X$, not through $\ell_X$ separately.

**Round $C$ to get the narrowest admissible surrogate.** Rounding $C$ to LSB $\ell$ gives $|\lfloor C\rceil_\ell-C|\le2^{\ell-1}$ (eq. 12.23), which is decreasing in $\ell$, so there is a largest $\ell_{\max}$ with $2^{\ell_{\max}-1}<\overline\delta_C$, and every $\ell\le\ell_{\max}$ also qualifies. $\lfloor C\rceil_{\ell_{\max}}$ has the minimum word size among all admissible $\widetilde C$, and any adder graph for it — recoded via [[CSD Constant Multiplier]] or optimised by [[Minimum-Adder Constant Multiplier]] — is a faithful multiplier by $C$.

> [!important]
> $\ell_{\max}$ gives the **narrowest** constant, never the cheapest one. Adder-graph cost is erratic in the constant, not monotone in its word size.

**Search the interval, do not settle on its rounding.** Eq. 12.22 describes an open interval

$$C-\overline\delta_C<\widetilde C<C+\overline\delta_C \tag{12.24, p.\,389}$$

containing infinitely many admissible constants, at LSBs $\ell=\ell_{\max}-k$ for $k\ge0$ — panel (b) of the diagram. Two reasons to enumerate them (p. 389). First, the graph cost depends on the bit pattern, so a *wider* $\widetilde C$ with a friendlier pattern is often cheaper (Gustafsson & Qureshi). Second, a $\widetilde C$ closer to $C$ leaves unused error budget, and that slack can be spent truncating the shift-and-add graph itself — deleting the low full adders of its internal additions, whose lost bits are then just another error term to keep under $\overline\delta_C$. ILP models that trade truncation error against deleted full adders, and that fold the final rounding half-ulp into one of the graph's own adders, are the state of the art (de Dinechin et al. 2019; Garcia & Volkova; see [[ILP for Arithmetic Design]]).

**Work it: $C=\pi/4$, $X$ in $\mathrm{ufix}(7,0)$, $\ell_R=-4$.** Here $X_{\max}=255$ and $\mathrm{ulp}=2^{-4}=0.0625$, so

$$\overline\delta_C=\frac{2^{-5}}{255}=1.2255\times10^{-4}$$

$\ell=-12$ gives $2^{-13}=1.2207\times10^{-4}<\overline\delta_C$, only just; $\ell=-11$ gives $2.44\times10^{-4}$ and fails. So $\ell_{\max}=-12$ and $\widetilde C=\lfloor\pi/4\rceil_{-12}=3217\cdot2^{-12}$, since $\tfrac{\pi}{4}\cdot4096=3216.99$. In binary $3217=110010010001_2=2^{11}+2^{10}+2^7+2^4+2^0$: five nonzeros, four adders. CSD folds the leading $11$ into $2^{12}-2^{10}$, giving $10\bar10010010001_{\mathrm{CSD}}$ — still five nonzeros, still four adders, so recoding buys nothing here. The realised constant error is $|3217/4096-\pi/4|=2.2\times10^{-6}$, a factor $55$ inside budget: exactly the slack the previous paragraph says to spend on truncation rather than leave on the table.

**Widths, end to end, for that example.** $X$ is $8$ bits. $P(X)=3217X\le820335<2^{20}$, so the graph's output is $20$ bits at $\ell_P=-12$, i.e. $(m_P,\ell_P)=(7,-12)$. Rounding to $\ell_R=-4$ drops $8$ bits and leaves $(m_R,\ell_R)=(7,-4)$, $12$ bits — $m_R=7$ because $255\cdot0.7854=200.3<2^8$. The four graph adders are $\le20$ bits with a critical path of three of them; the shifts are wiring and cost nothing on either target. On FPGA those adders map to hard carry chains at roughly one LUT per bit, which is why a wider $\widetilde C$ hurts far less here than on ASIC, where adder area and delay both grow with width — and it is also why, on FPGA, [[Fix-by-Real KCM]] wins this particular contest: the same specification costs about $38$ LUTs at one LUT plus one carry chain of depth (p. 418).

$$\boxed{\ |\delta_C|<\overline\delta_C=\frac{2^{\ell_R-1}}{X_{\max}}\ }$$

**Where the analysis stops holding.**

- **Signed inputs.** $X_{\max}$ must be the largest *magnitude*, and in two's complement $|X_{\min}|=X_{\max}+1$. Using the positive maximum silently halves nothing but does break the bound at the single most negative input.
- **Correct rounding is not a small upgrade.** It requires $\ell'_{\max}\approx\ell_{\max}-w_X$ — roughly $w_X$ extra constant bits, hence a much larger adder graph, for one extra bit of accuracy (p. 389, and §15.1.4).
- **Growth in $w_X$.** $\overline\delta_C$ falls like $1/X_{\max}$, so $\ell_{\max}$ drops about one bit per input bit; $\widetilde C$ widens, its nonzero count grows with it, and the adder count follows. Table-based techniques scale on the number of chunks instead and take over — the crossover for the worked example above is already past.
- **Degenerate constants.** $C=0$ and $C=\pm2^n$ are wires, not graphs, and the whole analysis collapses. Special-case them before invoking any of this.
- **Truncating inside the graph.** Once the graph no longer computes $\widetilde CX$ exactly, $P(X)$ is not exact, the telescoping above has a third term, and $\overline\delta_C$ alone no longer certifies faithfulness. That is precisely why the truncation search must be an ILP with the error terms modelled, not a peephole pass.

**Build the worked example.**

```spade
// Faithful multiplier by C = pi/4, X in ufix(7,0) (X_max = 255), output LSB l_R = -4.
// Ctilde = floor(pi/4)_{-12} = 3217 * 2^-12 = 2^11 + 2^10 + 2^7 + 2^4 + 2^0
entity fix_real_mul_pi4(x: uint<8>) -> uint<12> {
    let x0: uint<20> = zext(x);                       // 3217*255 = 820335 < 2^20
    let t0: uint<20> = trunc(x0 + (x0 << 4));         // (2^4 + 2^0) X
    let t1: uint<20> = trunc((x0 << 7) + (x0 << 10)); // (2^10 + 2^7) X
    let t2: uint<20> = trunc(t1 + (x0 << 11));        // (2^11 + 2^10 + 2^7) X
    let p:  uint<20> = trunc(t0 + t2);                // P(X) = 3217 X, exact, ulp 2^-12
    let h:  uint<20> = trunc(p + 128);                // + 2^(l_R-1) half-ulp rounding bit
    trunc(h >> 8)                                     // truncate to l_R = -4
}
```

`t0`, `t1`, `t2`, `p` are the four adders of the graph; `x0 << k` is the free wiring, not logic. `p` carries $(m_P,\ell_P)=(7,-12)$ in $20$ bits and the returned value carries $(m_R,\ell_R)=(7,-4)$ in $12$ — the `>> 8` *is* the drop of $\ell_P$ to $\ell_R$, and the `+ 128` before it is the half-ulp that converts the truncation into a round-to-nearest. Every `trunc` is provably lossless here because $3217\cdot255+128<2^{20}$; that is the width argument, not a convenience. The block is purely combinational, and synthesis will not keep this adder shape — it flattens the whole thing into one carry-propagate structure, which is exactly the freedom the ILP truncation model exploits.

Simulated with `.zettel/sim.sh`: 3007 vectors (0, 1, 2, 128, 173, 254, 255 plus a 3000-point random sweep), each checked twice — against the exact integer reference $(3217X+128)\gg8$, and against the *real* value $\tfrac{\pi}{4}X$ with the faithfulness predicate $|R-\tfrac{\pi}{4}X|<2^{-4}$. Zero failures. $X=173$ returns $2174$, i.e. $135.875$, matching the hand-worked value.

**Related notes.**

- [[Binary Shift-and-Add Constant Multiplier]] – depends-on: supplies the integer graph this note wraps in an error budget.
- [[CSD Constant Multiplier]] – depends-on: the recoding normally applied to $\widetilde C$ before building the graph.
- [[Minimum-Adder Constant Multiplier]] – extends: optimises the graph for a *given* $\widetilde C$; this note chooses which $\widetilde C$ to hand it.
- [[Fix-by-Real KCM]] – compares: same specification, table decomposition instead of a graph, and the error budget splits over $D$ tables rather than one constant.
- [[Tabulated Perfectly Rounded Constant Multiplier]] – compares: the half-ulp reference this operator deliberately falls short of to stay affordable.
- [[Choosing a Constant Multiplier]] – compares: where the crossover to table-based methods actually sits.
- [[Error Analysis]] – supports: the faithful-versus-correct-rounding definitions the whole budget rests on.
- [[Rounding]] – supports: why round-to-nearest costs half an ulp and how the pre-added rounding bit implements it.
- [[Fixed-Point Representations]] – supports: the $(m,\ell)$ format notation and $X_{\max}$.
- [[ILP for Arithmetic Design]] – extends: the truncation-versus-full-adders trade that spends the leftover budget.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

- §12.3, generator interface and the output LSB $\ell_R$, Fig. 12.11, p. 386
- §12.3.1, perfectly rounded tabulation as the half-ulp reference, Fig. 12.12, pp. 386–387
- §12.3.2, faithful fix-by-real using shift-and-add, eqs. 12.15–12.24, Figs. 12.13–12.14, pp. 387–389
- §12.3.2, the $\widetilde C$ search, ILP truncation models, and correct rounding at $\ell'_{\max}\approx\ell_{\max}-w_X$, p. 389
- §12.6, FPGA cost rules of thumb, p. 418
