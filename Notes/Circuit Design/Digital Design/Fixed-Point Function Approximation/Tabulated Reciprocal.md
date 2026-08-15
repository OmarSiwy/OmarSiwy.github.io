---
title: Tabulated Reciprocal
description: "1/x as 2/(x+1)-1 on [0,1): the +1 and -1 are free bit ops, and the one extra MSB that f(0)=1 demands is absorbed by the leading-zero-count and shift reconstruction."
kind: circuit
source: "ASA §16.2.1, pp. 483-485; §16.4.2, pp. 491-492"
status: seed
spade: simulated
tags: [digital, reciprocal, division, table, rom, fixed-point, fpga]
aliases:
  - Reciprocal Table
  - Reciprocal ROM
  - Tabulated Reciprocals
---

# Tabulated Reciprocal

A ROM evaluating $1/x$ through the change of variable $f(x)=\tfrac{2}{x+1}-1$ on $[0,1)$, chosen so that every step of the argument reduction and every step of the output offset is a wire rename rather than an operator — at the price of one output bit of weight $2^{0}$ that exactly one input ever uses.

```tikz title="Discretization of 2/(x+1)-1 on 4-bit input and output, with the single point above the format ceiling"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=6.6cm,y=4.0cm,>=latex,font=\small]
  \fill[red!8] (0,0.9375) rectangle (1.0,1.06);
  \draw[gray!22,step=0.0625] (0,0) grid (0.9375,0.9375);
  \draw[dashed,red!70!black] (0,0.9375) -- (1.0,0.9375);
  \node[anchor=west,font=\scriptsize,red!70!black,align=left] at (0.62,1.005)
      {$\mathrm{ufix}(-1,-4)$ ceiling $=\tfrac{15}{16}$};
  \draw[very thick,blue!55!black,domain=0:0.99,samples=140,variable=\x]
      plot ({\x},{2/(\x+1)-1});
  \foreach \i/\r in {1/14,2/12,3/11,4/10,5/8,6/7,7/6,8/5,9/4,10/4,11/3,12/2,13/2,14/1,15/1}
      \fill[blue!60!black] ({\i/16},{\r/16}) circle (1.6pt);
  \fill[red] (0,1) circle (2.6pt);
  \node[anchor=west,font=\scriptsize,red,align=left] at (0.035,1.0)
      {$f(0)=1$ exactly};
  \draw[->] (0,0) -- (1.03,0) node[below,font=\scriptsize] {$x$};
  \draw[->] (0,0) -- (0,1.10) node[above,font=\scriptsize] {$f(x)$};
  \node[left,font=\scriptsize] at (0,1) {$\tfrac{16}{16}=1$};
  \node[left,font=\scriptsize] at (0,0.5) {$\tfrac{8}{16}$};
  \node[left,font=\scriptsize] at (0,0) {$0$};
  \node[below,font=\scriptsize] at (0,-0.015) {$0$};
  \node[below,font=\scriptsize] at (0.5,-0.015) {$\tfrac{8}{16}$};
  \node[below,font=\scriptsize] at (0.9375,-0.015) {$\tfrac{15}{16}$};
\end{circuitikz}
\end{document}
```

*After Fig. 16.7, p. 484. Blue: $\mathrm{RN}(f(X))$ for the 15 inputs whose rounded value fits $\mathrm{ufix}(-1,-4)$. Red: the sixteenth.*

**Exploit the scale-covariance of the reciprocal to bound the domain.** For any integer $n$,

$$\frac{1}{2^{n}x}=2^{-n}\cdot\frac{1}{x},$$

so a table covering one binade determines $1/x$ everywhere: the exponent of the argument passes through the operator additively and never enters the table. The canonical binade is $[1,2)$, because that is where a normalized significand already lives. Producing that normalized form from an arbitrary $X$ is a [[Leading Zero Counters|leading-zero count]] feeding a [[Barrel Shifters|barrel shifter]] — the same [[Normalizers|normalizer]] a floating-point front end already contains, so on that path the reduction is free, and on a fixed-point path it is the whole cost of the operator.

**Slide $[1,2)$ onto the generator's standard domain, for free.** A function generator takes its input in $\mathrm{ufix}(-1,\ell_X)$, i.e. on $[0,1)$ — see [[Number Formats]]. Substituting $m=1+x$ turns the target $1/m$ on $[1,2)$ into $\tfrac{1}{x+1}$ on $[0,1)$. There is no adder behind that $+1$: $m$'s leading one is implicit in a normalized significand, so the bits handed to the table *are* $x$. The change of variable is the act of not wiring the MSB.

**Rescale the output so the format is not half empty.** $\tfrac{1}{x+1}$ maps $[0,1)$ onto $(\tfrac12,1]$, which occupies one binade of a format that spans two — the MSB of the result is constant $0$ everywhere except at the single point $1$, so one bit of the output word carries no information and the effective precision is one bit short of what the width paid for. Multiplying by $2$ and subtracting $1$ repairs both ends at once:

$$f(x)=\frac{2}{x+1}-1,\qquad f(0)=1,\quad f(1)=0.$$

The $\times 2$ is a change of the exponent attached to the output bus, i.e. a relabelling. The $-1$ is the removal of an implicit leading one, exactly as in the input substitution: $\tfrac{2}{x+1}\in(1,2]$, so the weight-$2^{0}$ bit of that quantity is $1$ for every $x>0$ and subtracting one is discarding it. Neither costs a gate. The book's phrasing — "both the $+1$ and $-1$ are trivial bit operations that entail no cost" (p. 484) — is that observation twice.

**One input escapes the argument, and it is $x=0$.** The word *every* above excluded $x>0$ for a reason: $\tfrac{2}{0+1}=2$, whose weight-$2^{0}$ bit is $0$ and whose weight-$2^{1}$ bit is $1$. Subtracting $1$ leaves $f(0)=1$, which is **not** in $\mathrm{ufix}(-1,\ell_{\text{out}})$ — that format's largest value is $1-2^{\ell_{\text{out}}}$. The output format must be widened to $\mathrm{ufix}(0,\ell_{\text{out}})$, $2-\ell_{\text{out}}$ bits instead of $1-\ell_{\text{out}}$, and that whole extra column of the ROM is exercised by one address out of $2^{w_X}$. This is fix (a) — widen the output — of the four range fixes catalogued in [[Fixed-Point Function Approximation]], chosen here because the alternatives are worse: saturating would return $1-2^{\ell_{\text{out}}}$ for $1/1$, and the scaling fix (d) would multiply a function whose whole appeal is that its constants are powers of two by $1-2^{\ell_{\text{out}}}$.

**On an FPGA, that column is the cheapest bit in the table.** A $2^{k}\times n$ ROM built from $\alpha$-input LUTs costs $2^{\max(k-\alpha,0)}\times n$ LUTs, one column of LUTs per output bit (§16.4.2, p. 492), so the extra MSB is nominally one more LUT column. But the function that column implements is $[\,x=0\,]$ — a single $k$-input NOR of the address, which for $k\le\alpha$ is one LUT and which the synthesiser will merge into the address decode it already built. On ASIC the empirical area model $A\propto 2^{0.65\min(k,n)}2^{0.19|k-n|}$ is symmetric in $k$ and $n$ and is dominated by sub-expression sharing between outputs, so a constant-$0$-except-one-address output bit is close to free there as well.

> [!important] The extra bit is not overhead, it is a carry into the exponent
> Reconstruction computes $1/X$ from the table. With $X=2^{k}(1+x)$, the identity $\tfrac{1}{1+x}=\tfrac{1+f(x)}{2}$ gives
> $$\frac{1}{X}=2^{-k-1}\bigl(1+f(x)\bigr),$$
> and $1+f\in[1,2]$ is again a significand with its implicit one restored by concatenation. Only $f=1$ leaves it unnormalized, at $2$ — and renormalizing $2$ means halving the significand back to $1$ while *decrementing the shift amount by one*. The denormalizing shifter's control path is already an adder on $k$; the extra table bit lands in it as a borrow. Cost: one equality comparator, one mux on the significand, and no widening anywhere downstream. That is what "the reconstruction logic absorbs it" means.

**Widths, for a concrete 8-bit operator.** $X$ is $8$ bits and nonzero; $k=\lfloor\log_2 X\rfloor$ is $3$ bits; $X_n=X\ll(7-k)$ is $8$ bits with bit $7$ known to be $1$; the table address $a=X_n[6{:}3]$ is $4$ bits; $f$ is $5$ bits in $\mathrm{ufix}(0,-4)$, taking the values $16,14,12,11,10,8,7,6,5,4,4,3,2,2,1,1$ in units of $\tfrac1{16}$; the significand $s=1+f$ is $5$ bits; the shift amount $e$ is $4$ bits, since $k+5\le 12$.

```tikz title="Reciprocal datapath: leading-zero count, normalizing shift, table, and the reconstruction that absorbs the extra MSB"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex,font=\small,
  blk/.style={draw,minimum height=0.95cm,align=center,inner sep=3pt,font=\small}]
  \node[blk,minimum width=1.5cm] (lzc) at (0,1.6)      {LZC};
  \node[blk,minimum width=2.2cm] (sh)  at (3.0,1.6)    {shift left\\ by $7-k$};
  \node[blk,minimum width=2.6cm] (rom) at (6.6,1.6)    {ROM $2^{4}\times 5$\\[-2pt] \scriptsize $f=\mathrm{RN}\!\left(\frac{2}{1+a}-1\right)$};
  \node[blk,minimum width=1.6cm] (mux) at (11.6,1.6)   {mux};
  \node[blk,minimum width=1.9cm] (cmp) at (8.4,-0.8)   {$f = 16\,?$};
  \node[blk,minimum width=2.5cm] (inc) at (11.6,-0.8)  {$k+5-\mathit{ovf}$};

  \draw[->,thick] (-3.4,1.6) -- (lzc.west);
  \node[anchor=south,font=\scriptsize] at (-2.4,1.68) {$X$\;\;8};
  \fill (-1.6,1.6) circle (2pt);
  \draw[->,thick] (-1.6,1.6) -- (-1.6,3.3) -- (3.0,3.3) -- (sh.north);
  \node[anchor=south,font=\scriptsize] at (1.0,3.36) {8};

  \draw[->,thick] (lzc.east) -- (sh.west);
  \node[anchor=south,font=\scriptsize] at (1.32,1.68) {$k$\;\;3};

  \draw[->,thick] (sh.east) -- (rom.west);
  \node[anchor=south,font=\scriptsize] at (4.7,1.68) {$a$\;\;4};

  \draw[->,thick] (rom.east) -- (mux.west);
  \node[anchor=south,font=\scriptsize] at (8.9,1.68) {$f$\;\;5};

  \fill (8.4,1.6) circle (2pt);
  \draw[->,thick] (8.4,1.6) -- (cmp.north);

  \draw[thick] (cmp.east) -- (9.9,-0.8);
  \draw[->,thick] (9.9,-0.8) -- (inc.west);
  \draw[->,thick] (9.9,-0.8) -- (9.9,0.6) -- (11.6,0.6) -- (mux.south);
  \node[anchor=south,font=\scriptsize] at (10.7,0.66) {$\mathit{ovf}$};

  \fill (1.32,1.6) circle (2pt);
  \draw[->,thick] (1.32,1.6) -- (1.32,-2.4) -- (11.6,-2.4) -- (inc.south);
  \node[anchor=south,font=\scriptsize] at (6.5,-2.34) {$k$\;\;3};

  \draw[->,thick] (mux.east) -- (13.9,1.6);
  \node[anchor=south,font=\scriptsize] at (13.0,1.68) {$s$\;\;5};
  \draw[->,thick] (inc.east) -- (13.9,-0.8);
  \node[anchor=south,font=\scriptsize] at (13.4,-0.72) {$e$\;\;4};

  \node[anchor=south,font=\scriptsize,align=center] at (11.6,2.35)
      {$s = 16+f$, or $16$ when $\mathit{ovf}$};
  \node[anchor=west,font=\small] at (14.1,0.4) {$\dfrac{1}{X}\approx s\cdot 2^{-e}$};
  \node[anchor=west,font=\scriptsize,gray!45!black,align=left] at (-3.4,0.3)
      {$X = 2^{k}(1+a)$,\\ $a\in[0,1)$};
\end{circuitikz}
\end{document}
```

*Own construction; the book states that a workaround exists for each context but does not draw one.*

> [!warning] The reconstruction datapath is not in the source
> §16.2.1 establishes the change of variable and the extra bit, then says only that "a sensible workaround exists for each context where the function is used" (p. 484). The $\mathit{ovf}$ mux, the borrow into the shift amount and the error figures below are this note's construction, checked by exhaustive simulation rather than taken from the book.

**Accuracy is set by the address width, not by the table.** The ROM can be filled with correctly rounded values — for $\le 24$ input bits that is a finite enumeration in multiple precision — but the circuit above truncates $X_n$ from $8$ bits to a $4$-bit address before the table sees it, and that truncation is a relative perturbation of the argument of up to $2^{-5}$. Since $\left|\tfrac{d}{dm}\tfrac1m\right|\cdot m = \tfrac1m$, the reciprocal neither amplifies nor damps relative error, so the argument truncation passes through at roughly its own size and dominates the table's own $\tfrac12$ ulp. Measured over all $255$ legal inputs the worst relative error is $0.0601\approx 2^{-4.06}$: with an $a$-bit address the operator is good to about $2^{-a}$ relative, i.e. $a$ correct bits, regardless of how many bits the ROM stores. Widening the output past that buys nothing — which is the point of the [[Error Accuracy|error budget]] being computed before the format is chosen, not after. FloPoCo's `f="2/(x+1)-1" signedIn=false lsbIn=-8 lsbOut=-16` is the counter-example that makes the rule visible: it is legitimate only when the full $8$-bit argument reaches the table, and then $17$ output bits are genuinely earned.

$$\boxed{\ f(x)=\frac{2}{x+1}-1\ \text{ on }[0,1),\qquad f(0)=1,\ f(1)=0,\qquad \frac{1}{X}=2^{-k-1}\bigl(1+f(x)\bigr)\ \text{ for } X=2^{k}(1+x)\ }$$

**When it breaks.**

- $X=0$ has no leading one. The LZC returns a don't-care and the whole reduction is meaningless; the operator needs a separate zero flag, and this is the one input a random sweep will generate and a hand-written vector list will not.
- Forget the weight-$2^{0}$ output bit and $f(0)=1$ does not saturate, it **wraps**: $1.0000_2$ truncated to $\mathrm{ufix}(-1,-4)$ is $0.0000_2$. The reciprocal of the *smallest* significand returns the *smallest* result. One input in $2^{w_X}$, always the first one, and it survives random testing.
- The table is $2^{a}$ entries. Past roughly $a=10$–$12$ the exponential kills it and the operator must move to a [[Fixed-Point Function Approximation|multipartite or polynomial]] scheme; plain tabulation is the baseline those are measured against, not a competitor at high precision.
- $f$ is decreasing, so a correctly rounded table is monotonic for free, but a *faithful* one is not — it may wobble by one ulp. If the reciprocal feeds a comparison or an inverse lookup rather than a multiply, pay for correct rounding.
- $x=1$ is outside the half-open domain, so $f$ never attains $0$; at $4$ bits the last entry is $\tfrac1{16}$, not $0$. Code that special-cases "the table bottoms out at zero" is testing for a value that cannot occur.
- The whole scheme presupposes that normalization is already there. Standing alone in a fixed-point datapath, the LZC and the shifter cost far more than the ROM, and [[Dividers|a digit-recurrence divider]] may win outright.

**RTL.**

```spade
/// Position of the leading one of a non-zero 8-bit X: X = 2^k * (1 + a).
fn lzc8(x: uint<8>) -> uint<3> {
    let b = x.as_bits();
    if b[7] { 7 } else if b[6] { 6 } else if b[5] { 5 } else if b[4] { 4 }
    else if b[3] { 3 } else if b[2] { 2 } else if b[1] { 1 } else { 0 }
}

/// f(a) = RN(2/(1+a/16) - 1), in ulps of 1/16. Only entry 0 sets the weight-2^0 bit.
fn recip_table(a: uint<4>) -> uint<5> {
    let rom: [uint<5>; 16] = [16, 14, 12, 11, 10, 8, 7, 6, 5, 4, 4, 3, 2, 2, 1, 1];
    rom[a]
}

/// 1/X ~= s * 2^-e  for 1 <= X < 256.
entity recip8(x: uint<8>) -> (uint<5>, uint<4>) {
    let k  = lzc8(x);
    let xn = x << zext::<3, 8>(trunc(7 - k));      // leading one now in bit 7
    let a  = xn.as_bits()[3..7].as_uint();         // the 4 bits just below it
    let f  = recip_table(a);
    let ovf = f == 16;                             // 1 + f = 2, needs weight 2^1
    let s: uint<5> = if ovf { 16 } else { trunc(zext::<5, 6>(f) + 16) };
    let e: uint<4> = if ovf { trunc(zext::<3, 5>(k) + 4) }
                     else   { trunc(zext::<3, 5>(k) + 5) };
    (s, e)
}
```

`lzc8` is the LZC box and `x << (7-k)` the barrel shifter; `a` is the four bits the shifter delivers below the implicit one, and `rom[a]` is the $2^4\times 5$ table — synthesis will not build a memory here, it will build five LUT columns, and the fifth reduces to the four-input decode of `a == 0`. The `ovf` mux and the `+4` versus `+5` on `e` are the whole absorption trick: `s` never widens past $5$ bits and `e` never past $4$. Everything is combinational; a real operator would register `f` behind the ROM, which on FPGA is free in the block-RAM output register but on ASIC is a real flop bank. Note the width discipline Spade forces — `zext::<5,6>(f) + 16` widens to $6$ bits before `trunc` brings it back, because `+` grows by one bit and $16+f\le 31$ only *after* you know `ovf` is false.

**Related notes.**

- [[Leading Zero Counters]] – depends-on: supplies $k$, without which the domain reduction $\tfrac{1}{2^{n}x}=2^{-n}\tfrac1x$ cannot be applied.
- [[Barrel Shifters]] – depends-on: performs the $\ll(7-k)$ that exposes the table address, and the reverse shift that consumes $e$.
- [[Normalizers]] – supports: the LZC-plus-shifter pair as one block; if the datapath already has one, the reciprocal's reduction is free.
- [[Division by Reciprocal]] – extends: turns this table into a quotient by a multiply, usually after one Newton or Goldschmidt refinement of $s$.
- [[Dividers]] – compares: where a tabulated reciprocal sits against digit recurrence, which needs no table and no normalizer but iterates.
- [[Number Formats]] – depends-on: $\mathrm{ufix}(-1,\ell)$ versus $\mathrm{ufix}(0,\ell)$ is the entire content of the extra-bit problem.
- [[Error Accuracy]] – supports: the $2^{-a}$ relative bound is an ulp argument, stated once there.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §16.2.1 *Range Issues and Their Solutions*, pp. 481-484 — the four fixes, and the reciprocal as the subtle case; Fig. 16.7, p. 484.
  - §16.2.2 *Monotonicity Issue*, p. 485 — correct rounding preserves monotonicity, faithful rounding does not.
  - §16.4.2 *Actual Cost of a ROM*, pp. 491-492 — the FPGA $2^{\max(k-\alpha,0)}\times n$ LUT count and the ASIC area model $A\propto 2^{0.65\min(k,n)}2^{0.19|k-n|}$.
