---
title: Faithful Multiplier by Pi
description: "The chapter's whole method closed on one concrete operator: approximate pi to l_ext bits, multiply, truncate, round once — and the budget says g=2 guard bits, no more."
kind: circuit
source: "ASA §3.1.7 & §3.3.3, pp. 73-76, 83-84"
status: seed
spade: simulated
tags: [digital, error-accuracy]
aliases:
  - Multiplier by Pi
  - Faithful Pi Multiplier
  - Multiplication by Pi
  - Pi Multiplier
---

# Faithful Multiplier by Pi

A constant multiplier for $f(X)=\pi X$ that is last-bit accurate rather than correctly rounded, because $\pi$ must itself be approximated and the resulting second error term cannot be squeezed into the half ulp that the final rounding has already spent.

```tikz title="Faithful multiplier by pi: exact product on 2 guard bits, truncated, then rounded once"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth,
  box/.style={draw, rounded corners=1pt, minimum height=13mm, minimum width=16mm, align=center}]
  \node (x) at (0,0.55) {$X$};
  \node (pt) at (0,-0.55) {$\widetilde\pi$};
  \node[box] (mul) at (3.6,0) {$\times$};
  \node[box, minimum width=20mm] (tr) at (8.0,0) {truncate\\{\footnotesize (free)}};
  \node[box, minimum width=20mm] (rd) at (12.6,0) {round\\{\footnotesize $+\,2^{-9}$}};
  \node (r) at (16.9,0) {$R\approx\pi X$};
  \draw[->] (0.35,0.55) -- node[above,font=\scriptsize]{$\mathrm{ufix}(-1,-8)$, 8\,b} (2.8,0.55);
  \draw[->] (0.35,-0.55) -- node[below,font=\scriptsize]{$\mathrm{ufix}(1,-10)$, 12\,b} (2.8,-0.55);
  \draw[->] (4.4,0) -- node[above,font=\scriptsize,align=center]{$\widetilde\pi X$ exact\\$\mathrm{ufix}(1,-18)$, 20\,b} (7.0,0);
  \draw[->] (9.0,0) -- node[above,font=\scriptsize,align=center]{$R_{\mathrm{ext}}$\\$\mathrm{ufix}(1,-10)$, 12\,b} (11.6,0);
  \draw[->] (13.6,0) -- node[above,font=\scriptsize]{$\mathrm{ufix}(1,-8)$, 10\,b} (15.7,0);
  \node[font=\scriptsize,align=center] at (3.6,-1.5) {$|\delta_{\mathrm{approx}}|\le 2^{-11}$};
  \node[font=\scriptsize,align=center] at (8.0,-1.5) {$|\delta_{\mathrm{trunc}}|< 2^{-10}$};
  \node[font=\scriptsize,align=center] at (12.6,-1.5) {$|\delta_{\mathrm{final}}|\le 2^{-9}$\\{\itshape incompressible}};
  \draw[<->] (9.4,1.35) -- (13.4,1.35);
  \node[font=\scriptsize] at (11.4,1.6) {$g=2$ guard bits: $\ell_{\mathrm{ext}}=-10\;\to\;\ell_R=-8$};
  \node[font=\scriptsize,align=center] at (8.0,-2.4) {$|\delta_{\mathrm{datapath}}| < \tfrac32\cdot 2^{-10} = 0.375\,u \;<\; u/2$};
\end{circuitikz}
\end{document}
```

*after Fig. 3.2, p. 74, with the guard-bit truncation the figure leaves implicit.*

**Fix the interface, and the accuracy is already fixed.** Take $X\in\mathrm{ufix}(-1,\ell)$, so $0\le X<1$ on $-\ell$ bits, and ask for the same precision out: $R\in\mathrm{ufix}(1,\ell)$, which is $\ell$-wide enough because $\pi X<\pi<4$ and $\mathrm{ufix}(1,\ell)$ reaches just below $2^{2}$. That output format sets $u=\mathrm{ulp}=2^{\ell}$ and, by the convention of [[Faithful Operator]], the specification $\delta<u$ with no accuracy argument left to pass — see [[Number Formats]] for the format algebra. The worked instance below is $\ell=-8$: $X$ on 8 bits, $R$ on 10 bits, $u=2^{-8}$.

**The obstruction is that $\pi$ has no finite binary expansion.** "Compute exactly, then round once" — the recipe that makes IEEE 754 correct rounding cheap for $+,-,\times,\div,\sqrt{\;}$ — needs the exact value on finitely many bits, and $\pi$ does not offer one. So the architecture must first replace $\pi$ by a stored constant $\widetilde\pi=\lfloor\pi\rceil_{\ell_{\mathrm{ext}}}$, rounded to nearest at the internal LSB $\ell_{\mathrm{ext}}$. That single decision creates a **second** error term that no amount of care downstream removes:

$$\delta_\pi=\widetilde\pi-\pi,\qquad |\delta_\pi|\le 2^{\ell_{\mathrm{ext}}-1} \tag{3.2, 3.3}$$

**Push the constant's error through the multiplier by linearity.** An *exact* fixed-point multiplier on $X$ and $\widetilde\pi$ adds nothing of its own, so its whole discrepancy from the ideal is the constant's, scaled by the input:

$$\delta_{\mathrm{approx}}(X)=\widetilde\pi X-\pi X=(\widetilde\pi-\pi)X,\qquad
|\delta_{\mathrm{approx}}(X)|=|\widetilde\pi-\pi|\cdot|X|\le 2^{\ell_{\mathrm{ext}}-1} \tag{3.4}$$

by $|X|<1$. This is the one place the input format earns something: because $X$ is a fraction, the constant's error is *attenuated*, never amplified. On an input format with $m_X>-1$ the same step would multiply $|\delta_\pi|$ by $2^{m_X+1}$ and the budget below would move.

**Decompose the total error by inserting and cancelling the intermediate value.** The product $\widetilde\pi X$ lands on $\mathrm{ufix}(1,2\ell_{\mathrm{ext}})$ — the two LSBs multiply into weight $2^{2\ell_{\mathrm{ext}}}$ — so it is not in the output format and a final rounding is unavoidable. Telescoping through $\widetilde\pi X$ (the composition rule of [[Error Analysis]], $A-C=(A-B)+(B-C)$):

$$\delta(X)=R(X)-\pi X=\underbrace{\big(R(X)-\widetilde\pi X\big)}_{\delta_{\mathrm{round}}}+\underbrace{\big(\widetilde\pi X-\pi X\big)}_{\delta_{\mathrm{approx}}}$$

Take $\ell_{\mathrm{ext}}=\ell$ — no guard bits — and both terms are bounded by a half ulp, so the triangle inequality gives $|\delta(X)|\le 2^{\ell-1}+2^{\ell-1}=2^{\ell}=1\,\mathrm{ulp}$. **Faithful, and provably not round-to-nearest**: two half ulps do not fit inside one half ulp. That inequality is the general statement of §3.1.7 in miniature — as soon as any approximation enters, a 1-ulp bound is easy and a half-ulp bound is a different problem, because the final rounding alone consumes the entire round-to-nearest budget.

> [!warning] Two slips in the source at p. 75, worth knowing before you quote it
> Equation (3.6) states $\delta_{\mathrm{round}}(X)<2^{\ell-1}$ **strictly**, and the following page then says the bound "is attained" — the two cannot both hold. The bound is attained, so (3.6) should read $\le$. Counterexample at $\ell=-8$, $\widetilde\pi=\lfloor\pi\rceil_{-8}=804$: for $X=32/256$ the exact product is $804\cdot 32\cdot 2^{-16}=100.5\cdot 2^{-8}$, an exact tie, and ties-up gives $\delta_{\mathrm{round}}=+2^{-9}$ exactly. Four of the 256 inputs ($X\cdot 256\in\{32,96,160,224\}$) do this.
> The same sentence says the tie is "halfway between two consecutive $\mathrm{ufix}(1,2\ell)$ numbers". It cannot be: $\widetilde\pi X$ is an *exact* product of a $\mathrm{ufix}(1,\ell)$ and a $\mathrm{ufix}(-1,\ell)$ value, hence always lands **on** the $\mathrm{ufix}(1,2\ell)$ grid. The format meant is $\mathrm{ufix}(1,\ell)$, the output grid.
> Neither slip changes any conclusion; both will waste your afternoon if you try to reproduce the derivation literally.

**Buy the faithfulness back with guard bits.** Splitting (3.12) at $R_{\mathrm{ext}}$ shows the final rounding costs exactly $u/2$ and is incompressible, so faithfulness reduces to $|\delta_{\mathrm{datapath}}|<u/2$ — everything before the last rounding must fit in half an ulp. Carry $g=\ell_R-\ell_{\mathrm{ext}}$ extra LSBs internally and the two datapath terms are the approximation error (3.4) and one truncation of the product down to $\ell_{\mathrm{ext}}$:

$$|\delta_{\mathrm{approx}}|\le 2^{\ell_{\mathrm{ext}}-1},\qquad |\delta_{\mathrm{trunc}}|<2^{\ell_{\mathrm{ext}}}
\;\Longrightarrow\;|\delta_{\mathrm{datapath}}|<\tfrac32\cdot 2^{\ell_R-g}$$

Requiring $\tfrac32\,2^{\ell_R-g}<2^{\ell_R-1}$ and cancelling $2^{\ell_R}$ on both sides leaves $\tfrac32\,2^{1-g}<1$, i.e. $2^{g}>3$:

$$\boxed{\ g>\log_2 3\approx 1.585\ \Longrightarrow\ g=2\ \text{guard bits},\quad \delta<\tfrac32 2^{-10}+2^{-9}=0.875\,u<u\ }$$

The bound $0.875\,u$ is the whole design: it is strictly below $u$, so the operator is faithful by proof rather than by measurement, and $0.375\,u$ of the datapath's $0.5\,u$ share is what a third guard bit would be *wasting*.

**Size every wire from $\ell_{\mathrm{ext}}$.** At $\ell_R=-8$ and $g=2$: $\widetilde\pi=\lfloor\pi\rceil_{-10}=3217=\texttt{11.0010010001}_2$ on 12 bits, $X$ on 8 bits, their exact product on 20 bits at $\mathrm{ufix}(1,-18)$, truncated to 12 bits by dropping the low 8 — free, pure wiring — and rounded to 10 bits by adding $2^{-9}$ (the constant $\texttt{10}_2$ at the internal LSB) and dropping the last two. Only the constant's width tracks $g$; the multiplier grows by $g$ rows of partial products and nothing else does.

**Walk the worst input.** $X=83/128=\texttt{0.10100110}_2$:

$$
\begin{aligned}
\widetilde\pi &= \texttt{11.0010010001}_2 = 3.1416015625 &&\delta_\pi=+8.909\cdot10^{-6}\\
\widetilde\pi\cdot X &= \texttt{10.000010011000000110}_2 &&\text{exact, 18 fractional bits}\\
R_{\mathrm{ext}}=\lfloor\widetilde\pi X\rfloor_{-10} &= \texttt{10.0000100110}_2 = 2.037109375\\
R=\lfloor R_{\mathrm{ext}}\rceil_{-8} &= \texttt{10.00001010}_2 = 2.0390625 &&\text{discarded }\texttt{10}\text{: a tie, rounded up}\\
\pi X &= 2.0371264\ldots
\end{aligned}
$$

| term | value | bound |
| --- | --- | --- |
| $\delta_{\mathrm{approx}}$ | $+0.0015$ ulp | $\le 2^{-11}=0.125$ ulp |
| $\delta_{\mathrm{trunc}}$ | $-0.0059$ ulp | $<2^{-10}=0.25$ ulp |
| $\delta_{\mathrm{final}}$ | $+0.5000$ ulp | $\le 0.5$ ulp |
| **total** | $\mathbf{+0.4956}$ **ulp** | $<0.875$ ulp |

This is the worst of all 256 inputs, and the two datapath terms together contribute $-0.0044$ ulp: the error is *entirely* the incompressible final rounding. Nothing internal is left to optimise, which is what "computing just right" looks like when $g$ is correct.

**$g$ cannot be shaved, even though a smaller $g$ appears to work.** Exhaustive evaluation over the whole 256-point domain:

| $g$ | proven bound | measured worst $\lvert\delta\rvert$ | faithful? |
| --- | --- | --- | --- |
| $0$ | $1.5\,u$ | $1.177\,u$ | **no** — 28 of 256 inputs violate it |
| $1$ | $1.25\,u$ | $0.708\,u$ | not provable, though it happens to hold here |
| $2$ | $0.875\,u$ | $0.496\,u$ | **yes** |

$g=0$ is not a near miss: it degenerates to plain truncation at $\ell_R$ and returns non-adjacent values on 11% of inputs. $g=1$ passes by luck — exactly the situation an error budget exists to forbid, since you ship the bound and not the experiment. At $g=2$ the operator turns out to be correctly rounded on all 256 inputs, but establishing *that* needs the enumeration, not the bound; it is the [[Correctly-Rounded Product Table]] argument, and it terminates only because $\pi$ is irrational, so no $\pi X$ is ever the rational tie $n\cdot2^{\ell-1}$.

**On FPGA the rounding constant is free and the guard bits are not.** The final $+2^{-9}$ is a single extra column entry in the bit heap that already sums the partial products, or the unused carry-in of the adder that already terminates it, so round-to-nearest here costs what truncation costs — take that route whenever the architecture offers it. The guard bits are the real price: $g$ more partial-product rows, $g$ more bits of routing and register on every internal signal, and a cost curve that is a **step function** rather than a line, because it moves against LUT granularity, hard carry-chain lengths and DSP-block port widths — see [[FPGAs]]. That is why $g$ belongs in design-space exploration and not in a closed formula.

**When it breaks.**

- **The input is not a fraction.** $|\delta_{\mathrm{approx}}|\le|\delta_\pi|\cdot|X|$ used $|X|<1$. For $X\in\mathrm{ufix}(m_X,\ell)$ with $m_X\ge0$ the term grows by $2^{m_X+1}$ and $g$ must be re-solved; the $\tfrac32$ in the budget is not a constant of the method.
- **A real truncated multiplier is not "exact multiply, then truncate".** The $|\delta_{\mathrm{trunc}}|<2^{\ell_{\mathrm{ext}}}$ term above is the error of discarding *bits of an exact product*. An architecture that never builds the low columns ([[Truncated Multipliers]]) commits several ulps at $\ell_{\mathrm{ext}}$ and needs its own term in the same $u/2$; substituting one for the other silently breaks the proof.
- **The spec was round-to-nearest.** No $g$ rescues it. Correct rounding needs $|\delta_{\mathrm{datapath}}|<\min_X|f(X)-m(X)|$, a hardest-to-round distance, and any finite $g$ is defeated by an input closer to a midpoint than $2^{-g}$. Tabulate instead, or widen $\widetilde\pi$ to whatever precision the table-filling algorithm ever needed — which is a bigger multiplier, not a bigger constant.
- **The constant stops being irrational.** For a rational constant the ties are reachable, the table-filling termination argument evaporates, and the periodic structure of the expansion changes the cheapest architecture entirely.
- **Width.** At $\ell=-8$ a 12$\times$8 multiplier is one DSP block or a handful of adders and the guard bits are noise. At $\ell=-40$ the $g$ extra rows are a measurable fraction of a large multiplier, and moving the accuracy out of the multiplier — into a table, or a [[Shift-and-Add]] decomposition of $\widetilde\pi$ — starts to win.

**RTL (Spade).**

```spade
/// Faithful multiplier by pi: X in ufix(-1,-8), R in ufix(1,-8), g = 2 guard bits.
entity pi_mul8(x: uint<8>) -> uint<10> {
    let pi_t: uint<12> = 3217;             // round(pi * 2^10) = 11.0010010001_2
    let xz:   uint<12> = zext(x);
    let p:    uint<24> = pi_t * xz;        // exact product, LSB weight 2^-18
    let r_ext: uint<12> = trunc(p >> 8);   // truncate to ufix(1,-10): R_ext
    trunc((r_ext + 2) >> 2)                // + 2^-9, drop g=2 guard bits
}
```

Every wire is the diagram's: `pi_t` is $\widetilde\pi$, `p` is the multiplier output, `r_ext` is $R_{\mathrm{ext}}$, the return value is $R$. The widths are scale bookkeeping only — `zext` costs nothing because $X$ is unsigned, `>> 8` and `>> 2` are wire slices, and the `+ 2` is the half-ulp injection at $\ell_{\mathrm{ext}}$. Spade's `*` returns $2N$ bits so `p` is declared 24 wide while only 20 can ever be nonzero ($3217\cdot255<2^{20}$); synthesis prunes the dead four. Purely combinational: no `reg`, so the block is one long carry path and wants pipelining at any real frequency. Two things synthesis does that the drawing does not show — the constant multiplier is folded into shift-and-add or a DSP block rather than a general $12\times8$ array, and the `+ 2` disappears into the multiplier's final adder as a carry-in, which is the "free rounding" claim made concrete.

Simulated with `.zettel/sim.sh`: 5 named vectors (including the worked case $X\cdot256=166\to R\cdot256=522$, and the deliberately asymmetric pair $X\cdot256=1\to3$ against $X\cdot256=128\to402$, which a bit-reversed datapath cannot reproduce), the **exhaustive** 256-point domain, and a 3000-vector random sweep — 3261 vectors, 0 mismatches against the behavioural reference and **0 faithfulness violations** against $|R-\pi X|<2^{-8}$ evaluated from $\pi$ at $2^{-30}$. The sweep also confirms the note's claim that $g=2$ happens to be correctly rounded here: 0 inputs exceed a half ulp.

**Related Notes.**

- [[Faithful Operator]] – depends-on: supplies the $\delta<u$ specification this operator is built to satisfy, and the reason $u/2$ is the datapath's entire budget.
- [[Error Analysis]] – supports: the insert-and-cancel chain and the late triangle inequality used to split $\delta$ into $\delta_{\mathrm{approx}}$ and $\delta_{\mathrm{round}}$.
- [[Round-to-Nearest Ties-Up]] – supports: the final stage is exactly $\lfloor Y+2^{\ell-1}\rfloor_\ell$, whose whole cost is the one added bit.
- [[Correctly-Rounded Product Table]] – compares: the finite correctly-rounded alternative for this same function, bought with a $2^{w_X}$-entry table instead of a multiplier.
- [[Truncated Multipliers]] – extends: replaces exact-multiply-then-truncate with a datapath that never builds the low columns, at the price of a new term in the same budget.
- [[Shift-and-Add]] – extends: once $\widetilde\pi$ is fixed, the multiplier itself becomes a hard-coded adder graph.
- [[Multiplication by Constants]] – compares: the full space of architectures for a constant $\widetilde\pi$, of which the exact multiplier here is the crudest point.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.

| § | Topic | Pages |
| --- | --- | --- |
| 3.1.7 | rounding to the nearest when an approximation is involved; Eqs. (3.2)–(3.6), Fig. 3.2 | 73–76 |
| 3.1.8 | faithful operators, Definition 3.5 | 76–77 |
| 3.3.3 | error budget and design-space exploration, Eq. (3.12), Fig. 3.4 | 83–84 |
| 3.1.4 | rounding versus truncation; the free half-ulp injection | 69–70 |

Long-form source: [[1.2) Error Accuracy]], sections "Rounding to the Nearest When an Approximation Is Involved" and "Worked Example".
