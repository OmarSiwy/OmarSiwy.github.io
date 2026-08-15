---
title: Polynomial hZ Evaluator
description: "Replaces the h(Z) ROM with the generic piecewise-polynomial evaluator on h(x) = e^(2^-k x) - 2^-k x - 1, giving two independent knobs (k for the eA table, d for the polynomial's table-vs-multiplier split) and scaling to double precision at k=9, d=2."
kind: circuit
source: "ASA §22.5.3, pp. 660-661"
status: seed
spade: simulated
tags: [digital, exponential, polynomial, horner, fixed-point, fpga, fixed-point-computation-of-ey]
aliases:
  - Polynomial h(Z) Evaluator
  - Piecewise Polynomial h Evaluator
  - Polynomial Approximation of h(Z)
---

# Polynomial hZ Evaluator

The $h$ box of the [[Higher-Order eY Architecture]] built as a generic piecewise-polynomial evaluator instead of a flat ROM, so that the argument bits it must read stop being the bits that address memory.

```tikz title="Piecewise-polynomial h(Z) evaluator: coefficient ROM addressed by the leading bits, Horner on the rest"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---------- argument word ----------
  \draw (-5.0,6.2) rectangle (4.0,6.8);
  \draw (-2.4,6.2) -- (-2.4,6.8);
  \node at (-3.7,6.5) {$A$};
  \node at (0.8,6.5) {$y = x - A$};
  \node[anchor=east] at (-5.05,6.5) {$x = 2^{k}Z$};
  \node[anchor=south west,font=\footnotesize] at (-5.0,6.82) {MSB $-1$};
  \node[anchor=south east,font=\footnotesize] at (4.0,6.82) {LSB $p+k$};
  \draw[<->] (-5.0,7.5) -- (-2.4,7.5);
  \node[anchor=south,font=\footnotesize] at (-3.7,7.52) {$\alpha$ bits};
  \draw[<->] (-2.4,7.5) -- (4.0,7.5);
  \node[anchor=south,font=\footnotesize] at (0.8,7.52) {$|\ell|-2k+g'+1-\alpha$ bits};

  % ---------- coefficient ROM ----------
  \draw[->] (-3.7,6.2) -- (-3.7,4.9);
  \draw (-5.0,0.6) rectangle (-2.4,4.9);
  \node[align=center] at (-3.7,3.0)
    {coefficient ROM\\[2pt] $2^{\alpha}$ entries\\[2pt] $(c_0,c_1,\dots,c_d)$\\[2pt] minimax fit\\ per subinterval};

  % ---------- y bus ----------
  \draw (3.4,6.2) -- (3.4,4.55);
  \node[anchor=west,font=\footnotesize] at (3.45,5.6) {$y$};
  \draw[->] (3.4,4.55) -- (2.2,4.55);
  \draw (3.4,4.55) -- (3.4,2.15);
  \draw[->] (3.4,2.15) -- (2.2,2.15);

  % ---------- Horner chain ----------
  \draw (0.2,4.2) rectangle (2.2,4.9);
  \node at (1.2,4.55) {$\times$};
  \draw[->] (-2.4,4.55) -- (0.2,4.55);
  \node[anchor=south,font=\footnotesize] at (-1.1,4.60) {$c_2$};

  \draw[->] (1.2,4.2) -- (1.2,3.7);
  \draw (0.2,3.0) rectangle (2.2,3.7);
  \node at (1.2,3.35) {$+$};
  \draw[->] (-2.4,3.35) -- (0.2,3.35);
  \node[anchor=south,font=\footnotesize] at (-1.1,3.40) {$c_1$};

  \draw[->] (1.2,3.0) -- (1.2,2.5);
  \node[anchor=west,font=\footnotesize] at (1.25,2.75) {$c_2y+c_1$};
  \draw (0.2,1.8) rectangle (2.2,2.5);
  \node at (1.2,2.15) {$\times$};

  \draw[->] (1.2,1.8) -- (1.2,1.3);
  \draw (0.2,0.6) rectangle (2.2,1.3);
  \node at (1.2,0.95) {$+$};
  \draw[->] (-2.4,0.95) -- (0.2,0.95);
  \node[anchor=south,font=\footnotesize] at (-1.1,1.00) {$c_0$};

  \draw[->] (1.2,0.6) -- (1.2,-0.3);
  \node[anchor=west] at (1.25,0.15) {$H$\quad\texttt{ufix}$(-2k-1,\ell-g')$};

  % ---------- annotations ----------
  \node[anchor=west,font=\footnotesize,align=left] at (3.6,3.35)
    {$d$ truncated\\ multipliers,\\ Horner depth $d$\\ (drawn for $d=2$)};
\end{circuitikz}
\end{document}
```

*Own construction: §22.5.3 (pp. 660–661) gives only the black-box contract, so the internals drawn here are the generic evaluator of [[Polynomial Approximation]] instantiated on $h$. Input and output formats are read off Fig. 22.6, p. 657; $\ell=-w_F-g$ and $g'$, $p$ are that figure's parameters.*

**Normalise the argument so a black box can take it.** The generic fixed-point function approximator ([[Fixed-Point Function Approximation]]) accepts a function $[0,1]\to[0,1]$ plus an input and an output format; it does not accept an argument that lives in $[0,2^{-k})$. Substitute

$$x = 2^{k}Z\in[0,1),\qquad h(Z)=e^{Z}-Z-1 \;\Longrightarrow\; h(x) = e^{2^{-k}x} - 2^{-k}x - 1$$

which is (22.24) after the change of variable. The scaling is free: multiplying a fixed-point word by $2^k$ moves every bit's weight by the same amount, so it is a relabelling of the format's exponent and not a single gate. The $2^{-k}$ that appears inside the exponential is likewise free — it is a constant of the function being fitted, absorbed into the coefficients at fit time. What crosses the boundary into the evaluator is the word $Z_{\mathrm{trunc}}$ of the [[Higher-Order eY Architecture]] relabelled as $x$: MSB at $-1$, LSB at $p+k$, hence

$$|\ell| - 2k + g' + 1 \ \text{bits}$$

using $p=\ell-g'+k-1$ from that note's $\delta_{\mathrm{trunc}Z}$ balance. The output keeps the format Fig. 22.6 asks for, `ufix`$(-2k-1,\ \ell-g')$, because $0\le h<2^{-2k}$ by (22.26) — the leading $2k+1$ bits are constant zero and are never materialised.

**What the black box is inside.** Split $[0,1]$ into $2^{\alpha}$ equal subintervals addressed by the $\alpha$ leading bits $A$ of $x$; store in a $2^{\alpha}$-entry ROM the $d+1$ coefficients of the degree-$d$ minimax polynomial for $h$ on that subinterval ([[Remez Minimax]]); evaluate it on the local argument $y=x-A$ by [[Horner Evaluation]], which is $d$ multiplications and $d$ additions in a chain of depth $d$. Every multiplier is truncated, since a full-width product would be discarded down to the output format anyway ([[Multipliers]]).

> [!important] A flat table buys one bit of accuracy per address bit; a degree-$d$ polynomial buys $d+1$. That is the entire reason this note exists — the polynomial decouples *how many argument bits must be read* from *how many bits address memory*.

**Why the flat table dies and this does not.** The [[hZ Table]] must be addressed by the whole of $Z_{\mathrm{trunc}}$, so its address width is the argument width above — linear in the precision, hence exponential cost. At IEEE single ($\ell=-27$, $k=10$, $g'=0$) that is $27-20+1=8$ bits and the table is a corner of a block RAM. At double ($w_F=52$, and $g=4$ from the §22.5.1 error budget, so $\ell=-56$) with $k=9$ it is $56-18+1=39$ bits: $2^{39}$ entries. Raising $k$ removes two address bits per bit of $k$ but doubles the $e^A$ table ([[eA Table]]), and the two cross around $k=19$ — $2^{19}$ entries on each side, tens of megabits. There is no $k$ that saves it. The polynomial changes the exponent instead: with the standard equioscillation bound of [[Remez Minimax]], the approximation error on a subinterval of length $2^{-\alpha}$ is

$$\varepsilon_d \approx \frac{\|h^{(d+1)}\|_\infty\,2^{-\alpha(d+1)}}{2^{2d+1}(d+1)!},\qquad h^{(d+1)}(x)=2^{-(d+1)k}e^{2^{-k}x}\le 2^{-(d+1)k}\cdot e^{2^{-k}}$$

so $\varepsilon_d\approx 2^{-(d+1)(k+\alpha)}/\!\left(2^{2d+1}(d+1)!\right)$: **each extra address bit is worth $d+1$ bits of accuracy**. At the book's double-precision point $k=9$, $d=2$, $\alpha=9$ this is $2^{-54}/192\approx 2^{-61.6}$, comfortably inside $u=2^{-56}$, with the margin left over for coefficient rounding and the Horner truncations. $2^{\alpha}=512$ intervals, and a 39-bit argument of which 30 bits go into multipliers rather than into an address decoder.

**Two knobs, and they really are independent.** $k$ is set outside this box: it sizes the $2^k$-entry $e^A$ table and, through (22.26), everything downstream. $d$ is set inside it and fixes the table-versus-multiplier split — raising $d$ by one lets $\alpha$ drop by roughly $\alpha/(d+2)$ bits at constant accuracy, shrinking the coefficient ROM exponentially while adding one multiplier and one Horner level of latency. $d=0$ degenerates to a plain lookup and recovers [[hZ Table]] exactly, which is why this construction strictly generalises it. That the book's double-precision point happens to have $\alpha=9=k$ is arithmetic coincidence, not a structural tie.

**What it costs in the error budget.** A generic approximator is contracted to be *faithful*, not correctly rounded, so the $\delta_H$ row of the [[Higher-Order eY Architecture]] error analysis takes its larger value $1.65u$ rather than $1.65u/2$. Compensate by truncating the $e^A$ table one bit less aggressively, $t=k-1$ instead of $t=k$, which halves $\delta_{\mathrm{trunc}T}$ from $1.25u$ to $0.625u$; the total lands at $\bar\delta_{\mathrm{arch}}=4.9u$ against $4.7u$ for the correctly rounded table (p. 659). Both are under $5u$, so $g=4$ either way — the half-ulp of genericity is paid for by one bit of table width, not by a guard bit.

**FPGA and ASIC.** Still tables plus multipliers, so the mapping of [[eY DSP and BRAM Mapping]] applies unchanged: coefficient ROM into block memory, Horner multipliers into DSP blocks, and the same free-accuracy tricks (widen the ROM output up to the memory's native width; if a Horner multiplier fits one DSP its product is exact). Because $d$ trades ROM for multipliers directly, the knob points in opposite directions on the two technologies — a fabric rich in memory wants small $d$, one short of memory wants large $d$ — and the book notes the best trade-off is technology-dependent and also depends on what the rest of the application is consuming ([[FPGAs]]). [[FloPoCo]]'s `FPExp` picks defaults for $k$ and $d$ and exposes both in expert mode.

$$\boxed{\ h(x)=e^{2^{-k}x}-2^{-k}x-1\ \text{ on }x=2^{k}Z\in[0,1],\qquad H=\big((c_d y + c_{d-1})y+\cdots\big)y + c_0\ }$$

**When it breaks.**

- Below single precision it is not worth it: at $\ell=-27$, $k=10$ the flat [[hZ Table]] is $2^8$ entries and shares one block RAM with the $e^A$ table. A coefficient ROM plus two multipliers cannot beat that.
- $d$ large enough that the Horner chain dominates the latency: depth $d$ is serial, and unlike the $e^A$ table it cannot be hidden behind the range reduction.
- The faithful-only contract is inherited. If the surrounding operator ever needs correct rounding rather than the 1-ulp faithfulness of the surrounding floating-point exponential, nothing in this box provides it.
- The argument scaling is free *only* because it is a power of two. Any range reduction whose scaling is not $2^{-k}$ pays for a real multiplier before the evaluator.

> [!warning] Not covered in the source — needs outside research
> §22.5.3 is one page and treats the evaluator as a black box: it gives $k=9$, $d=2$ and 512 intervals for double precision and **no word widths at all** — not the coefficient widths, not $\alpha$ as a formula, not the internal guard bits of the Horner chain. The $\alpha=9$ used above is read back from "512 intervals"; the error scaling law is derived here from [[Remez Minimax]], not quoted. Treat the widths in the diagram's Horner chain as the general construction, not as this design point's sizing.

> [!warning] Not covered in the source — needs outside research
> Chapter 22 reports no LUT, slice, DSP or delay figures for any $e^Y$ architecture, this one included, so there is no measured comparison of the polynomial $h$ against the tabulated $h$ — only the table-size arithmetic above.

**The Horner core in RTL.**

```spade
entity horner2(c0: uint<16>, c1: uint<16>, c2: uint<16>, y: uint<8>) -> uint<18> {
    let p2: uint<16> = trunc((c2 * zext::<8, 16>(y)) >> 8);
    let s1: uint<17> = c1 + p2;
    let p1: uint<17> = trunc((s1 * zext::<8, 17>(y)) >> 8);
    zext::<16, 17>(c0) + p1
}
```

`y` is the local argument of the diagram, weight $2^{-8}$ per LSB, and `c0,c1,c2` are one ROM entry — the coefficient fetch is a plain ROM read on the $\alpha$ leading bits and is not shown. Each `>> 8` **is** the truncated multiplier: it discards the eight LSBs of the product, which is exactly the realignment the fixed-point weights demand, and it is the only source of error in the block. Widths grow $16\to17\to18$ down the chain because each Horner addition can carry out; nothing wraps, so the 18-bit output is exact with respect to the truncations. The block is purely combinational and its critical path is $d=2$ multipliers deep — synthesis will retime a register into the middle of it, which the drawing does not show.

Verified: compiles clean, and simulated against a behavioural truncated-Horner reference over 11 named vectors (including $c_1$-only versus $c_2$-only at the same $y$, which is what catches a swapped coefficient order) plus a 3000-vector random sweep — 3011/3011 exact.

**Related notes.**

- [[hZ Table]] – compares: the $d=0$ degenerate case of this evaluator, and the thing it replaces once the address width goes past a block RAM.
- [[Higher-Order eY Architecture]] – depends-on: supplies the $Z_{\mathrm{trunc}}$ input format, the output format, and the $\delta_H$ slot this box fills.
- [[Polynomial Approximation]] – depends-on: the generic evaluator used here as a black box.
- [[Remez Minimax]] – supports: produces the per-subinterval coefficients and the error bound that sets $\alpha$.
- [[Horner Evaluation]] – supports: the multiply-add chain in the diagram.
- [[Fixed-Point Function Approximation]] – supports: the $[0,1]\to[0,1]$ contract the argument had to be normalised into.
- [[eA Table]] – compares: the other table, whose $2^k$ growth is what stops $k$ from rescuing the flat $h$ table.
- [[eY DSP and BRAM Mapping]] – extends: how the ROM and the Horner multipliers land on hard blocks.
- [[Choosing an eY Architecture]] – compares: where this variant sits against the whole family.
- [[FloPoCo]] – supports: `FPExp` chooses $k$ and $d$, expert mode exposes them.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §22.5.3 Polynomial approximation for large precisions — pp. 660–661 (the $h(x)=e^{2^{-k}x}-2^{-k}x-1$ normalisation; $k$ and $d$ as the two parameters; $k=9$, $d=2$, 512 intervals for double; FloPoCo `FPExp` defaults and expert mode)
- §22.5.1 Using large tables and square multipliers — pp. 655–659 (Fig. 22.6 formats; eq. 22.24, 22.26; the $\delta_H$ and $\delta_{\mathrm{trunc}T}$ rows and the $4.7u$ / $4.9u$ settlements)
- §22.5.4 FPGA-specific remarks — p. 661 (single-precision table sizes used above for the crossover argument)
- Chapter 18, the generic polynomial evaluator, cited by §22.5.3 as the black box

Long-form source: [[Fixed-Point Computation of eY]].
