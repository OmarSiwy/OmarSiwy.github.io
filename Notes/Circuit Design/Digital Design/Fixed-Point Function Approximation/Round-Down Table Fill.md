---
title: "Round-Down Table Fill"
description: "Define the tabulated function as RD(f) rather than RN(f) so the top value can never round up — zero hardware, but the error budget doubles to a full ulp everywhere."
kind: circuit
source: "ASA §16.2.1, pp. 481-484 (Fig. 16.6c, p. 483)"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rounding, table, rom]
aliases:
  - Rounding Down
  - Round-Down Fill
  - RD Table Fill
---

# Round-Down Table Fill

A table-generation policy that stores $\mathrm{RD}(f(X))$ instead of $\mathrm{RN}(f(X))$, so that the tabulated value is never larger than the true one and therefore can never leave the top of the output format — the only one of the four range fixes that changes no hardware at all.

```tikz title="Round-down fill of the 4-bit sine table: every entry sits in the one-ulp band below the curve, so nothing reaches 16/16"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=7.4cm,y=4.6cm,>=latex,font=\small]
  \draw[gray!22,step=0.0625] (0,0) grid (1,1);
  \fill[green!14,domain=0:1,samples=90,variable=\x]
      plot ({\x},{sin(90*\x)}) --
      plot[domain=1:0] ({\x},{sin(90*\x)-0.0625}) -- cycle;
  \draw[red,very thick,domain=0:1,samples=120,variable=\x] plot ({\x},{sin(90*\x)});
  \draw[blue!60!black,dashed,thick] (0,0.9375) -- (1.0,0.9375);
  \foreach \i/\r in {0/0,1/1,2/3,3/4,4/6,5/7,6/8,7/10,8/11,9/12,10/13,11/14,12/14,13/15,14/15,15/15}
      \fill[blue!60!black] ({\i/16},{\r/16}) circle (1.5pt);
  \foreach \i in {14,15} {
      \draw[red,thick,dotted] ({\i/16},0.9375) -- ({\i/16},0.99);
      \draw[red,thick] ({\i/16},1) circle (2.0pt);
  }
  \draw[->] (0,0) -- (1.03,0) node[anchor=north west,font=\scriptsize] {$X$ \, (4 bits)};
  \draw[->] (0,0) -- (0,1.13);
  \node[font=\scriptsize,align=right,anchor=south east] at (0.02,1.14) {$\widetilde f(X)$\\(4 bits)};
  \node[left,font=\scriptsize] at (0,0.9375) {$\tfrac{15}{16}$};
  \node[left,font=\scriptsize] at (0,0.5) {$\tfrac{8}{16}$};
  \node[left,font=\scriptsize] at (0,0) {$0$};
  \node[below,font=\scriptsize] at (1,0) {$1$};
  \node[font=\scriptsize,anchor=west,fill=green!14] at (0.04,0.78)
       {round-down band $(\,f-u,\;f\,]$};
  \node[blue!60!black,font=\scriptsize,align=left,anchor=west] at (1.06,0.76)
       {top of the format:\\$\mathrm{ufix}(-1,-4)$ stops at $\tfrac{15}{16}$};
  \draw[->,blue!60!black,thin] (1.05,0.80) -- (0.97,0.9375);
  \node[red,font=\scriptsize,align=left,anchor=west] at (1.06,1.06)
       {$\tfrac{16}{16}$: where $\mathrm{RN}$ lands\\(and wraps to $0$)};
  \draw[->,red,thin] (1.05,1.03) -- (0.95,1.0);
\end{circuitikz}
\end{document}
```

*After Fig. 16.6c, p. 483.*

**Name the failure this removes.** Let the output format be $\mathrm{ufix}(m_{\text{out}},\ell_{\text{out}})$ with ulp $u=2^{\ell_{\text{out}}}$, so the representable set is $[\,0,\,2^{m_{\text{out}}+1}-u\,]\cap u\mathbb{Z}$ — see [[Number Formats]]. A table filled by round-to-nearest is correct iff $\max_{X}\mathrm{RN}(f(X))\le 2^{m_{\text{out}}+1}-u$, and that maximum is taken over the **discrete image**, not the continuous range. For $f=\sin(\tfrac\pi2 x)$ on $[0,1)$ in $\mathrm{ufix}(-1,-4)$ both formats, $f<1$ everywhere, yet $\mathrm{RN}(f(\tfrac{14}{16}))=\mathrm{RN}(f(\tfrac{15}{16}))=\tfrac{16}{16}$. The encoding $10000_2$ does not fit four bits, and the modulo property of fixed-point arithmetic replaces the largest value of the domain by the smallest. The fault is created **by the rounding**, not by the function.

**Remove it by choosing a rounding that cannot manufacture the overflow.** Define the tabulated function as
$$\widetilde f(X)\;=\;\mathrm{RD}\big(f(X)\big)\;=\;u\Big\lfloor \tfrac{f(X)}{u}\Big\rfloor .$$
Then $\widetilde f(X)\le f(X)$ by definition of the floor, and $\widetilde f(X)$ is by construction an integer multiple of $u$. If the function itself satisfies $f(X)<2^{m_{\text{out}}+1}$ on the whole domain — the hypothesis a designer already believes when they pick the format — the two facts combine: a multiple of $u$ strictly below $2^{m_{\text{out}}+1}$ is at most $2^{m_{\text{out}}+1}-u$. That is the entire correctness argument, and it needs nothing about $f$ beyond a strict bound on its supremum. In the figure, $16f$ reaches $15.693$ and $15.923$ at the last two grid points; $\lfloor\cdot\rfloor$ sends both to $15$, and the format's ceiling is $15$.

**The hardware cost is zero because the decision is made before the hardware exists.** A tabulated function is a ROM, and $\mathrm{RD}$ versus $\mathrm{RN}$ changes only what is written into it — same address width $k$, same word width $n$, same [[Function Table ROM]]. The generator holds each value at some higher precision $\ell_{\text{out}}-g$ with $g$ guard bits; producing the $\mathrm{RD}$ entry is then a **bit slice**, discarding the $g$ low bits, while producing the $\mathrm{RN}$ entry is *add $2^{\ell_{\text{out}}-1}$, then slice*, and the carry out of that addition is exactly the bit that does not fit. So round-down is not merely equal-cost, it is the operation you get by omitting a step. Compare with [[Output Format Widening]], which keeps $\mathrm{RN}$ and pays a bit: on an FPGA a $2^{k}\times n$ ROM built from $\alpha$-input LUTs costs $n$ LUTs whenever $k\le\alpha$ (p. 492), so widening $n$ from $4$ to $5$ costs one extra LUT out of four, a flat $25\%$; on ASIC the empirical standard-cell area of a tabulated function is $A\propto 2^{0.65\min(k,n)}\times 2^{0.19|k-n|}$ (Eq. 16.1, p. 491), and moving from $k=n=4$ to $k=4,n=5$ multiplies it by $2^{0.19}\approx1.14$. Round-down pays neither.

**Pay for it in the error budget instead, and note that the payment is a bias.** Round-to-nearest gives $|\widetilde f-f|\le u/2$; round-down gives $f-\widetilde f\in[0,u)$. The worst case doubles, which is the headline, but the operationally important change is that the error is now **one-sided**: for $f$ equidistributed modulo $u$ the mean error is exactly $-u/2$ instead of $0$, while the variance stays $u^2/12$. Feed $N$ table lookups into an accumulator and the systematic part grows as $N\,u/2$ while the random part grows as $\sqrt N\,u/\sqrt{12}$, so the bias dominates from the very first term and keeps pulling away. See [[Error Accuracy]] for how to carry that term through a budget.

> [!important] A doubled bound is a re-run budget, a systematic bias is a redesign
> Any downstream analysis that allocated half an ulp to the table must be redone with a full ulp — mechanical. But a $-u/2$ offset per lookup is not absorbed by a wider intermediate word; it is removed only by re-centring, e.g. by adding $2^{\ell_{\text{out}}-1}$ back at the accumulator, or by using [[Output Range Scaling]], which keeps the entries correctly rounded with respect to a scaled function.

**Round-down is still a faithful operator, and unlike faithfulness it is monotonic for free.** Faithful rounding permits either neighbour, $\widetilde f(X)\in\{u\lfloor f/u\rfloor,\,u\lceil f/u\rceil\}$; $\mathrm{RD}$ always picks the lower one, so a round-down table satisfies every faithful specification and additionally is a *function* rather than a relation. That matters because $\mathrm{RD}:\mathbb{R}\to\mathbb{F}$ is non-decreasing, and a composition of non-decreasing maps is non-decreasing: if $f$ is monotonic then so is the whole table, at no cost. A merely faithful table has no such guarantee — it may wobble by up to one ulp against a monotonic $f$ (p. 485), which breaks any downstream binary search or threshold comparison. Choosing round-down therefore buys determinism and monotonicity on top of the range fix; see [[Rounding]].

$$\boxed{\ \widetilde f(X)=u\Big\lfloor\tfrac{f(X)}{u}\Big\rfloor\ \le\ f(X)\ <\ 2^{m_{\text{out}}+1}\ \Longrightarrow\ \widetilde f(X)\le 2^{m_{\text{out}}+1}-u,\qquad 0\le f-\widetilde f<u\ }$$

**Where it breaks.**

- **The supremum bound must be strict.** If $f$ genuinely attains $2^{m_{\text{out}}+1}$ at some grid point, $\mathrm{RD}$ returns that value unchanged and the wrap is back. This is not hypothetical: the offset reciprocal $f(x)=\tfrac{2}{x+1}-1$ has $f(0)=1$ *exactly*, so no rounding mode saves it and the format must carry the bit of weight $2^{0}$ for one single entry — see [[Tabulated Reciprocal]]. Round-down removes rounding-induced overflow only, never a real range overflow.
- **Signed formats: it moves the wrap to the other end.** $\mathrm{RD}$ rounds toward $-\infty$, so on an $\mathrm{sfix}$ output it protects the top and endangers the bottom. If $f(X)=-2^{m_{\text{out}}+1}+\varepsilon$ with $0<\varepsilon<u$, then $u\lfloor f/u\rfloor=-2^{m_{\text{out}}+1}-u$, one step below the most negative representable value, and that wraps to the *largest positive* — the same catastrophe, mirrored. Round-toward-zero is the mode that is safe at both ends, and it is not $\mathrm{RD}$.
  > [!warning] The book treats only the unsigned case — the signed argument above is derived here, not cited
- **It taxes every entry to fix a vanishing minority.** For the sine, the fraction of inputs whose $\mathrm{RN}$ value overflows is about $\tfrac2\pi 2^{\ell/2}$: $2$ of $16$ at $\ell=-4$, but only $162$ of $65536$ at $\ell=-16$. Round-down doubles the error at all $65536$ to repair $162$ of them. At high precision, [[Saturating Output Clamp]] — which degrades only the offending points, to just under one ulp, and leaves the rest at half an ulp — is the better trade, and [[Output Range Scaling]] is better still where the application tolerates a rescaled function.
- **Bit-exactness against an $\mathrm{RN}$ reference is gone.** The circuit now implements a different function. Any golden model, cross-check, or downstream test vector built against round-to-nearest will disagree at roughly half the grid points, none of which is a bug.

**In RTL, the two fills differ by one adder that exists only at build time.**

```spade
/// Generation-time values of sin(pi/2 x) on [0,1), held to 8 fractional bits.
/// This is the table before the fill policy is applied.
fn sin_hi(x: uint<4>) -> uint<8> {
    let rom: [uint<8>; 16] = [0, 25, 49, 74, 97, 120, 142, 162,
                              181, 197, 212, 225, 236, 244, 251, 254];
    rom[x]
}

/// Round-down fill: drop the four guard bits. Pure wiring; the output stays
/// in ufix(-1,-4) for every one of the 16 addresses.
fn sin_rd(x: uint<4>) -> uint<4> {
    trunc(sin_hi(x) >> 4)
}

/// Round-to-nearest fill, for contrast: add half an ulp first. The carry out
/// of that 9-bit addition is the fifth output bit, and it is set for x = 14, 15.
fn sin_rn(x: uint<4>) -> uint<5> {
    let biased: uint<9> = zext(sin_hi(x)) + 8;
    trunc(biased >> 4)
}
```

`x` is the 4-bit address, the horizontal axis of the diagram; `sin_hi` is the generator's internal $2^{-8}$-precision value, which exists only at table-build time. `sin_rd` is the blue dot: `>> 4` selects bits 7 down to 4, so it costs no gates and the result is `uint<4>` for all inputs. `sin_rn` is the red circle: the `+ 8` widens to `uint<9>` and the slice must be `uint<5>`, which is precisely the extra MSB that [[Output Format Widening]] pays for. Both are combinational and unclocked. Synthesis will not build any of this: a table generator folds the shift into the constants and emits a 16-entry, 4-bit-wide ROM, so the `>> 4` disappears into wiring and only `sin_rd`'s *contents* survive.

**Related notes.**

- [[Output Format Widening]] – compares: fix (a), the same defect cured by spending an output bit instead of half an ulp.
- [[Saturating Output Clamp]] – compares: fix (b), degrades only the offending entries rather than all of them, at the price of comparison logic.
- [[Output Range Scaling]] – compares: fix (d), the generic fix; keeps entries correctly rounded with respect to a rescaled $f$, total bound $\approx1.5$ ulp.
- [[Function Table ROM]] – depends-on: the storage this policy fills; the fill choice never changes its dimensions.
- [[Tabulated Reciprocal]] – counter-example: $f(0)=1$ exactly, so the range problem survives every rounding mode.
- [[Rounding]] – depends-on: definitions of RN, RD and faithful rounding, and why RD is one of the faithful operators.
- [[Error Accuracy]] – supports: how a one-sided $u$-wide error term is carried through a budget, and why bias accumulates linearly.
- [[Choosing a Function Approximation Method]] – compares: where the fill policy sits among the decisions a table-based operator forces.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §16.2.1 *Range Issues and Their Solutions*, pp. 481-484 — the wrap, and the four fixes; Fig. 16.5 p. 482, Fig. 16.6c p. 483, Fig. 16.7 p. 484.
  - §16.2, p. 485 — monotonicity of correctly rounded versus faithful operators.
  - §16.4.2 *Actual Cost of a ROM*, pp. 491-492 — Eq. 16.1 for ASIC standard-cell area, and the $n$-LUT cost of a $2^{k}\times n$ FPGA ROM (Fig. 16.11, p. 492).
