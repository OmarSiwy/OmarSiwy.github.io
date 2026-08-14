---
title: "Correctly-Rounded Product Table"
description: "A ROM holding every correctly-rounded product, which exists only because pi is transcendental so no product ever lands on a tie — the finite architecture the multiplier cannot match."
kind: circuit
source: "ASA §3.1.7, pp. 73-76"
status: seed
spade: simulated
tags: [digital, error-accuracy, rounding, table, rom, constant-multiplication]
aliases:
  - Product Table
  - Correctly Rounded Product Table
  - Correctly-Rounded Product Tables
  - Tabulate-Everything Architecture
---

# Correctly-Rounded Product Table

A ROM addressed by the entire input word, holding $\lfloor\pi X\rceil_\ell$ precomputed for every $X$ — the one architecture in this chapter that achieves a $\tfrac12$-ulp error bound instead of settling for $1$ ulp.

```tikz title="Correctly-rounded product table: an offline fill loop writes a ROM that is read in one cycle"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=stealth]
  % ---- offline: the table-filling algorithm (software, run once per constant) ----
  \draw[dashed,rounded corners] (1.0,1.45) rectangle (8.7,3.5);
  \node[font=\scriptsize\itshape] at (4.85,3.18) {offline, once per constant --- software};
  \node[draw,rounded corners,align=center,font=\scriptsize,
        minimum width=2.6cm,minimum height=0.9cm] at (2.6,2.35)
       {for each\\ $x=0\ldots 2^{w_X}\!-\!1$};
  \node[draw,rounded corners,align=center,font=\scriptsize,
        minimum width=4.0cm,minimum height=0.9cm] at (6.3,2.35)
       {raise precision $p$ of $\widetilde{\pi}_p$\\ until $\lfloor\widetilde{\pi}_p X\rceil_\ell$ is decided};
  \draw[->] (3.9,2.35) -- (4.3,2.35);
  \draw[->] (6.3,1.9) -- (6.3,0.55);
  \node[anchor=north west,font=\scriptsize,align=left] at (6.45,1.2)
       {$2^{w_X}$ words,\\ $w_X\!+\!2$ bits each};

  % ---- online: one ROM read ----
  \node[draw,minimum width=3.6cm,minimum height=1.1cm,align=center]
       at (5.4,0) {ROM $\;2^{w_X}\times(w_X\!+\!2)$ bits\\[-2pt]
                   {\scriptsize $\mathrm{ROM}[x]=\lfloor \pi X\rceil_\ell$}};
  \draw[->] (1.0,0) -- (3.6,0);
  \node[anchor=south,font=\scriptsize] at (2.3,0.5) {address};
  \node[anchor=south,font=\scriptsize] at (2.3,0.08) {$w_X$};
  \node[anchor=north,font=\scriptsize] at (2.3,-0.12) {$\mathrm{ufix}(-1,\ell)$};
  \node[anchor=east] at (0.95,0) {$X$};

  \draw[->] (7.2,0) -- (9.6,0);
  \node[anchor=south,font=\scriptsize] at (8.4,0.08) {$w_X+2$};
  \node[anchor=north,font=\scriptsize] at (8.4,-0.12) {$\mathrm{ufix}(1,\ell)$};
  \node[anchor=west] at (9.65,0) {$R(X)$};

  \node[font=\scriptsize\itshape,anchor=west] at (1.0,-1.15)
       {no multiplier, no final rounder --- the rounding happened offline, so $|\delta|\le\tfrac12\,\mathrm{ulp}$};
\end{circuitikz}
\end{document}
```

*Own construction; it replaces the multiplier-plus-rounder datapath of Fig. 3.2, p. 74.*

**Replace the function by its graph.** The input is $X\in\mathrm{ufix}(-1,\ell)$ with $0\le X<1$, so the address is $w_X=-\ell$ bits wide and there are exactly $2^{w_X}$ possible inputs — a *finite* set, which is the whole leverage. The output format is $\mathrm{ufix}(1,\ell)$ because $\pi<4$ needs two integer bits, giving a data word of $1-\ell+1=w_X+2$ bits. Nothing about $\pi$ is evaluated at run time: the ROM stores the correctly-rounded value $R(X)=\lfloor\pi X\rceil_\ell$ for each address and the operator is one memory read. The error is then whatever the offline rounding committed and nothing more, so $|\delta(X)|\le\tfrac12\,\mathrm{ulp}$ by definition of $\lfloor\cdot\rceil_\ell$ — see [[Round-to-Nearest Ties-Up]] for the rounding itself.

**Locate the ties, and show no product hits one.** A tie of the output format is a point exactly halfway between two representable numbers, i.e. an *odd* multiple $(2n+1)2^{\ell-1}$. Write the input as $X=k\,2^{\ell}$ with $k$ an integer in $[0,2^{w_X})$. A tie would mean $\pi k\,2^{\ell}=(2n+1)2^{\ell-1}$, and dividing through by $2^{\ell}$ gives

$$\pi=\frac{2n+1}{2k}$$

which is rational, contradicting the irrationality of $\pi$ for every $k\ge1$. The remaining case $k=0$ gives $\pi X=0$, an *even* multiple of $2^{\ell-1}$ — exactly representable, so still not a tie. Every product therefore sits at a strictly positive distance from the tie grid.

**Turn "not a tie" into a terminating algorithm.** Let $d_k>0$ be the distance from $\pi k 2^{\ell}$ to the nearest tie. The input set is finite, so $d=\min_k d_k$ is a minimum over finitely many positive reals and is itself positive — this is the step that fails for an infinite input set and is why the argument needs the format to be fixed first. The fill loop computes $\widetilde{\pi}_p X$ at working precision $p$, brackets the exact product in an interval of width $O(2^{-p})$, and doubles $p$ whenever that interval straddles a tie. Since $d>0$, some finite $p$ makes the interval narrower than $d$, and from then on the rounding is decided for every address. Note the loop never needs to *know* $d$ — it only needs $d$ to exist, which is the entire content of the previous paragraph.

> [!important] Irrationality is what the proof uses, not transcendence
> The book asserts on p. 76 that "we needed the fact that $\pi$ is transcendental to prove that our algorithm for $\pi X$ would eventually terminate", while p. 75 correctly says *irrational*. The derivation above only ever divides a hypothetical tie equation by $2^\ell$ and reads off a rational $\pi$, so irrationality alone closes it. Counterexample to the stronger claim: $\sqrt2$ is irrational but algebraic (a root of $x^2-2$), and the identical fill algorithm terminates for $f(X)=\sqrt2\,X$ — $\sqrt2=(2n+1)/2k$ would make $\sqrt2$ rational just the same. Transcendence is never used.

**Pay for it in area, exponentially.** The table costs $2^{w_X}(w_X+2)$ bits and that is the only cost — no partial products, no compressor tree, no final carry propagation. At $w_X=8$ that is $256\times10=2560$ bits; at $w_X=12$, $4096\times14=57{,}344$ bits; at $w_X=16$, $65{,}536\times18\approx1.13$ Mibit; at $w_X=24$, $2^{24}\times26\approx416$ Mibit, which is not a circuit. On an FPGA the crossover is architectural rather than gradual: below roughly ten address bits the ROM lands in logic, where a 6-LUT *is* a $64\times1$ ROM, so the mapping costs about $2^{w_X}(w_X+2)/64$ LUT6 — $40$ LUT6 at $w_X=8$ — while above that it must move into [[Block Memory]], which is free until you run out and then infinitely expensive. On an ASIC the synthesiser sees a truth table rather than a memory and will factor it with a two-level minimiser, so the realised gate count is usually far below the raw bit count; the exponential still wins in the end.

**Why the multiplier cannot be patched into this.** The datapath of [[Faithful Multiplier by Pi]] commits two independent half-ulps — $\delta_{\mathrm{approx}}$ from truncating $\pi$ to $\widetilde\pi$, $\delta_{\mathrm{round}}$ from the final rounding — and by the triangle inequality their sum only bounds at $2^{\ell}=1$ ulp. Two half-ulps do not fit inside one half-ulp, so no amount of care in the multiplier array fixes it; the only repair is to widen $\widetilde\pi$ until $\delta_{\mathrm{approx}}$ is negligible against the *residual* half-ulp budget, and the precision that suffices is exactly the largest $p$ the table-filling loop ever reached. The table is thus not merely an alternative architecture — it is the thing that tells you how wide the multiplier would have to be (p. 75).

**Chunking the address destroys the property.** The obvious cure for the exponential is to split $X$ into $c$ chunks and sum $c$ smaller tables, which is [[KCM, Table-Based Constant Multiplication]]. Each sub-table is a rounded value, so the sum carries $c$ approximation errors *plus* the final rounding, and the operator drops straight back to faithful. Correct rounding here is a property of the *monolithic* table specifically: the moment the address is decomposed, $\delta_{\mathrm{approx}}$ reappears and the half-ulp budget is spent before the last rounding even happens.

$$\boxed{\ \mathrm{ROM}[x]=\big\lfloor \pi\, x2^{\ell}\big\rceil_\ell,\qquad 2^{w_X}\times(w_X{+}2)\ \text{bits},\qquad |\delta|\le\tfrac12\,\mathrm{ulp}\ }$$

**When it breaks.**

- **Above $w_X\approx16$** the table stops fitting any device and the exponential is the whole story; [[KCM, Table-Based Constant Multiplication]] takes over and you give up correct rounding to get it.
- **One constant per table.** Change $\pi$ to any other constant and the ROM is refilled from scratch; a run-time-variable multiplicand is not expressible here at all, since the address space would be $2^{w_X+w_C}$.
- **The tie argument is constant-specific.** It fails immediately for a *rational* constant — tabulate $f(X)=\tfrac12 X$ on $\mathrm{ufix}(1,\ell)$ and the odd $k$ land exactly on ties, so the fill loop must fall back on a tie rule and the entries stop being uniquely determined.
- **The tie rule is otherwise vacuous.** Because no product is ever a tie, choosing [[Round-to-Nearest Ties-to-Even]] over ties-up changes not one bit of the table — this is the only operator in the topic where that choice is genuinely free.
- **Correctness is enumerated, not bounded.** The half-ulp claim rests on having filled $2^{w_X}$ entries correctly, not on an error bound that composes. It cannot be reused as a lemma inside a larger [[Error Analysis]]; it must be re-established for whatever the next operator computes, which for a general function is the Table Maker's Dilemma — no algorithm proven to terminate on all inputs is known (p. 76).
- **Latency.** In logic the read is combinational; mapped to block RAM it is registered, so the operator acquires a cycle of latency that the drawing does not show.

```spade
/// Correctly-rounded product table for f(X) = pi*X, w_X = 4.
/// Address x is the ufix(-1,-4) code of X, i.e. X = x * 2^-4 with 0 <= X < 1.
/// Data is the ufix(1,-4) code of round(pi*X) = round(pi*x), on w_X + 2 = 6 bits.
entity pi_table(x: uint<4>) -> uint<6> {
    let rom: [uint<6>; 16] = [
        0,  3,  6,  9, 13, 16, 19, 22,
       25, 28, 31, 35, 38, 41, 44, 47,
    ];
    rom[x]
}
```

`x` is the address wire of the diagram and the array literal is the ROM body; there is no arithmetic operator anywhere, which is the point — every $\pi$ in the design lives in the sixteen constants. The width arithmetic is the format arithmetic: address $w_X=4$, data $w_X+2=6$, and the largest entry $47=\lfloor\pi\cdot15\rceil$ needs all six bits since $32\le47<64$. The block is purely combinational, so synthesis will *not* build the memory the diagram draws: a 4-input, 6-output truth table collapses into six LUTs, one per output bit, each holding a 16-entry column. Only past roughly ten address bits does a tool infer block RAM instead — and then add the output register the drawing does not show.

**Related Notes.**

- [[Faithful Multiplier by Pi]] – compares: the same function on a multiplier, one bit less accurate and vastly smaller.
- [[KCM, Table-Based Constant Multiplication]] – counter-example: splitting the address beats the exponential and loses correct rounding doing it.
- [[Table-Based Function Evaluation]] – extends: the same tabulate-everything move for an arbitrary $f$, where termination is no longer guaranteed.
- [[Error Analysis]] – counter-example: the composable error budget this operator deliberately abandons in favour of enumeration.
- [[Block Memory]] – depends-on: the resource the table moves into once the address passes ten bits.
- [[Round-to-Nearest Ties-to-Even]] – supports: the tie rule the entries were computed under, and the one operator where it never fires.
- [[Faithful Operator]] – compares: the 1-ulp specification everything else in the chapter is built to.
- [[Error Accuracy]] – depends-on: ulp, rounding modes and the error-decomposition this reuses.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Ch. 3, "Computing Just Right".

| § | Topic | Pages |
| --- | --- | --- |
| 3.1.3 | round-to-nearest, Eq. (3.1), ties as odd multiples of $2^{\ell-1}$ | 68–70 |
| 3.1.7 | approximation vs. rounding for $\pi X$, Fig. 3.2, Eqs. (3.2)–(3.6) | 73–75 |
| 3.1.7 | tabulating correctly-rounded products; termination; Table Maker's Dilemma | 75–76 |
| 3.1.8 | faithful operators, the 1-ulp fallback this architecture avoids | 76–77 |
