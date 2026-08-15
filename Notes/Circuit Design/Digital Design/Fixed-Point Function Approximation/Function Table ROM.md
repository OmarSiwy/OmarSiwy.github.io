---
title: Function Table ROM
description: "Tabulate f at every input code in a ROM — the only approximator needing no smoothness at all, at a cost of 2^n·m bits that doubles per input bit."
kind: circuit
source: "ASA §16.4-16.4.2, pp. 488-492"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rom, table, fpga]
aliases:
  - "Function Table ROM"
  - "Plain Tabulation"
  - "Simple Tabulation"
  - "FixFunctionByTable"
  - "Function ROM"
  - "Tabulated Function"
---

# Function Table ROM

A read-only memory addressed by the whole input word, holding one precomputed output word per input code — the only function approximator that assumes nothing about $f$ beyond being defined and finite on its domain.

```tikz title="Function table ROM: the input word is the address, the table is filled offline"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- the ROM itself -------------------------------------------------
  \draw[thick] (0,0) rectangle (4.6,4.3);
  \node[anchor=north] at (2.3,4.25) {ROM, $2^{n}\times m$};
  \draw (0,3.75) -- (4.6,3.75);
  \node[anchor=north,font=\scriptsize] at (1.15,3.7) {address $X$};
  \node[anchor=north,font=\scriptsize] at (3.45,3.7) {content $\widetilde f(X)$};
  \draw[gray] (2.3,0) -- (2.3,3.3);
  \foreach \r/\a/\c in {%
      0/{\ttfamily 0000}/{\ttfamily 0000},
      1/{\ttfamily 0001}/{\ttfamily 0001},
      2/{\ttfamily 0010}/{\ttfamily 0011},
      3/{$\vdots$}/{$\vdots$},
      4/{\ttfamily 1101}/{\ttfamily 1110},
      5/{\ttfamily 1110}/{\ttfamily 1111},
      6/{\ttfamily 1111}/{\ttfamily 1111}} {
    \node[font=\scriptsize] at (1.15,{3.05-0.45*\r}) {\a};
    \node[font=\scriptsize] at (3.45,{3.05-0.45*\r}) {\c};
  }

  % --- input ----------------------------------------------------------
  \draw[->,thick] (-3.0,2.15) -- (0,2.15);
  \draw[thick] (-1.7,1.9) -- (-1.5,2.4);
  \node[anchor=south,font=\scriptsize] at (-1.6,2.42) {$n$};
  \node[anchor=south] at (-2.5,2.25) {$X$};
  \node[anchor=north,font=\scriptsize,align=center] at (-2.45,2.05)
    {$\mathrm{ufix}(-1,\ell_X)$\\ $n=-\ell_X$ bits};

  % --- output ---------------------------------------------------------
  \draw[->,thick] (4.6,2.15) -- (7.6,2.15);
  \draw[thick] (5.9,1.9) -- (6.1,2.4);
  \node[anchor=south,font=\scriptsize] at (6.0,2.42) {$m$};
  \node[anchor=south] at (7.0,2.25) {$\widetilde f(X)$};
  \node[anchor=north,font=\scriptsize,align=center] at (7.3,1.95)
    {$\mathrm{ufix}(m_{\mathrm{out}},\ell_{\mathrm{out}})$\\ $m$ bits};

  % --- generation-time fill -------------------------------------------
  \node[draw,dashed,rounded corners=3pt,align=center,font=\scriptsize]
    (gen) at (2.3,5.9) {generation time (software, arbitrary precision)\\
      $\widetilde f(X)\leftarrow \mathrm{RN}\big(f(X)\big)$ for all $2^{n}$ codes\\
      Sollya / MPFR --- no hardware cost};
  \draw[->,dashed] (gen.south) -- (2.3,4.3);
  \node at (2.3,6.9) {};

  % --- cost -----------------------------------------------------------
  \node[anchor=north,font=\small] at (2.3,-0.45) {$B = 2^{n}\cdot m$ bits};
  \node[anchor=north,font=\scriptsize,align=center] at (2.3,-1.0)
    {exponential in $n$, linear in $m$};
\end{circuitikz}
\end{document}
```

*After Fig. 16.10, p. 489 and Fig. 16.11a, p. 492; contents are the scaled 4-bit sine table of §16.2.1.*

**Assume nothing about $f$ and the architecture writes itself.** The requirement list is one item long: $f$ must be *defined, with a finite value, at every point of its domain* (p. 488). Not continuous, not differentiable, not monotonic, not even a restriction of a real function. Every later family fails that test — multipartite and polynomial methods need continuity and bounded derivatives on the interval, digit recurrence needs $f$ algebraic — so plain tabulation is the *only* technique available for a function that is discontinuous, defined by cases, or simply given as data. The book's fourth hands-on case is $x^2 \bmod p$ (see [[Modular Squaring Table]]), which has a discontinuity at every multiple of $p$ and tabulates exactly as easily as a sine.

**Address the ROM with the input code, not the input value.** $X$ lives in $\mathrm{ufix}(-1,\ell_X)$, so its $n = -\ell_X$ bits are a plain unsigned integer $i$ with $X = i\cdot 2^{\ell_X}$; the ROM sees only $i$. The output word is $m = m_{\text{out}}-\ell_{\text{out}}+1$ bits of $\mathrm{ufix}(m_{\text{out}},\ell_{\text{out}})$, or of $\mathrm{sfix}$ when $f$ takes negative values. **The fixed-point scaling exists nowhere in the hardware** — no shift, no bias, no exponent — because $2^{\ell_X}$ and $2^{\ell_{\text{out}}}$ are constants known to the table-filling code and both cancel out of the address-to-content map. This is why a domain change of variable is free (see [[Fixed-Point Function Approximation]]): $\sin(\tfrac\pi2 x)$ and $\sin(\tfrac\pi4 x)$ produce different table *contents* and identical table *hardware*.

**Move all the numerical difficulty to generation time.** The entries are computed offline, in arbitrary precision, by arbitrarily expensive algorithms. FloPoCo delegates this to Sollya, and the feature that matters is not its coverage of elementary functions — that is roughly MPFR's — but that it evaluates an expression **with a guaranteed error bound**, even through cancellations (p. 489). The consequence is architectural, not numerical:

> [!note] Correct rounding is free here and nowhere else
> Choosing $\widetilde f = \mathrm{RN}(f)$ over $\mathrm{RD}(f)$ changes which constants go in the array. It changes no gate, no wire and no delay: "there is no architectural overhead in a correctly rounded table" (p. 488). Every other family pays real area for the last half-ulp — which is exactly why the book confines correct rounding of elementary functions to $\le 24$ bits, the range where the whole table can be enumerated offline in multiple precision.

**Read the cost straight off the address space.** The input format has $2^{n}$ distinct codes; tabulation relates $f$ at no two of them, so each needs its own $m$-bit entry, and the derivation ends there:

$$B \;=\; 2^{n}\cdot m \quad\text{bits.}$$

Adding one **input** bit doubles $B$; adding one **output** bit adds $2^{n}$ bits. In the book's words about the generated VHDL, it "is exponential in the input size, but only linear in the output size" (p. 490). That asymmetry is worth exploiting: the reciprocal case tabulates $\tfrac{2}{x+1}-1$ with `lsbIn=-8 lsbOut=-16`, sixteen output bits from eight input bits, for the same $2^8$ entries (see [[Tabulated Reciprocal]]). Going the other way is fatal — at $m=n$, $n=8$ gives 2 kbit, $n=12$ gives 48 kbit, $n=16$ gives 1 Mibit and $n=24$ gives 48 MiB, which is not a circuit.

**$2^{n}\cdot m$ is a bit count, not an area.** What the table *costs* depends entirely on how it is realised, and every realisation beats the raw bit count. On ASIC a small table is best handed to logic synthesis as an ordinary Boolean function; Gustafsson and Johansson measured the resulting area empirically and found it near-symmetric in the input width $k$ and output width $n$ (see [[Synthesized Logic Table]]):

$$A \;\propto\; 2^{\,0.65\min(k,n)}\times 2^{\,0.19|k-n|} \tag{16.1, p. 491}$$

The symmetry has a cause — synthesis both minimises each output's expression and maximises sub-expression sharing across outputs, so a gate graph mapping $k$ inputs to $n$ outputs costs about what one mapping $n$ to $k$ does. Note $0.65<1$: optimisation genuinely beats $2^k$, and does not remove the exponential. Transistor-level ROM generators ([[Hard ROM Macro]]) have a very low cost per bit, since stored constants reduce to wiring to the power rails and essentially all the logic is address decoding, but they forfeit that optimisation and in the same study came out **larger** than standard cells.

**On FPGA the LUT is both the primitive and the unit of cost.** An $\alpha$-input, one-output LUT *is* a $2^{\alpha}\times1$ ROM, so a $2^{\alpha}\times n$ table is $n$ LUTs sharing one address ([[Lookup-Tables]], [[LUT-Array Function Table]]), and in general a $2^{k}\times n$ ROM should cost $2^{\max(k-\alpha,0)}\times n$ LUTs (p. 492). That prediction is no more reliable than $2^k\times n$ was, and for the same reason: FPGA synthesis inherited the ASIC optimisation technology. On an $\alpha=6$ device the $2^{8}\times 8$ table for $\sin(\tfrac\pi2 x)$ synthesises into **25 LUTs, not the predicted $2^2\times8=32$**. Above roughly $n=10$ the answer switches to [[Block Memory]], whose contents load at configuration time and whose very coarse shape set makes it right for tables of a few tens of kilobits and wrong for anything smaller.

$$\boxed{\ B = 2^{n}\cdot m\ \text{bits},\qquad \text{LUTs}=2^{\max(n-\alpha,0)}\times m,\qquad A_{\text{ASIC}}\propto 2^{0.65\min(n,m)}2^{0.19|n-m|}\ }$$

**When it breaks.**

- $n \gtrsim 12$. One or two block RAMs still hold a 12-bit table; 16 bits is 1 Mibit for one function and 24 bits is 48 MiB. Every technique in [[Multipartite Methods]] and beyond exists to buy that exponent back.
- $n \le \alpha$ on FPGA. Shrinking the address below the LUT input count buys **nothing** — a $2^{\alpha-1}\times m$ ROM still costs $m$ LUTs, half of each wasted. Below $\alpha$ the table is free and no other method can beat it.
- The output format must be checked against the **discrete** image $\{\mathrm{RN}(f(X))\}$, not the continuous range. When $\mathrm{RN}(f(X))$ reaches $2^{m_{\text{out}}+1}$ the entry wraps to zero and the largest input silently returns the smallest output — repaired by [[Output Format Widening]], [[Saturating Output Clamp]], [[Round-Down Table Fill]] or [[Output Range Scaling]].
- Faithful table fill does not preserve monotonicity, even for monotonic $f$; correctly rounded fill does, since $\mathrm{RN}$, $\mathrm{RU}$ and $\mathrm{RD}$ are non-decreasing and a composition of non-decreasing maps is non-decreasing. See [[Rounding]].
- Two independent functions of the same input need two ROMs. Nothing here amortises across outputs beyond what logic synthesis finds by itself — the reason a $\sin$/$\cos$ pair is usually one wider table, not two.

**RTL (Spade).** A $2^4\times4$ table, filled with $\mathrm{RN}\!\big(16\cdot\tfrac{15}{16}\sin(\tfrac\pi2 X)\big)$ for $X = i/16$ — the scaled sine of the worked example, so that no entry reaches $16$ and the format needs no extra MSB.

```spade
fn sin_rom(a: uint<4>) -> uint<4> {
    // RN( 16 * (15/16) * sin(pi/2 * a/16) ), filled at generation time
    let t: [uint<4>; 16] = [0, 1, 3, 4, 6, 7, 8, 10, 11, 12, 12, 13, 14, 14, 15, 15];
    t[a]
}

entity fixfunc_sin4(x: uint<4>) -> uint<4> {
    sin_rom(x)
}
```

The whole ROM is the array literal — every line of arithmetic in this note happened before compile time, which is the point of the technique. `a` is the $n=4$ address wire of the diagram and `t[a]` the $m=4$ content wire; a `uint` index into an array is the one place Spade allows a runtime index, and it lowers to exactly the address decoder the drawing hides inside the box. The entity is purely combinational: `sin_rom` is a `fn`, so it cannot hold a register even by accident. Synthesis will *not* build the box in the drawing — at $n=4<\alpha$ it emits four 4-input LUTs of Boolean logic, and adding one `reg(clk)` on the output is what would instead make it infer a block RAM.

**Related Notes.**

- [[Choosing a Function Approximation Method]] – compares: where the flat table sits against every alternative in this topic.
- [[LUT-Array Function Table]] – extends: the same table mapped onto $m$ parallel $\alpha$-input LUTs sharing one address.
- [[Synthesized Logic Table]] – extends: the same truth table handed to logic synthesis, where eq. (16.1) applies.
- [[Hard ROM Macro]] – compares: transistor-level layout, lowest cost per bit, no logic optimisation, measured larger.
- [[Block Memory]] – depends-on: the FPGA primitive that takes over once the table passes a few tens of kilobits.
- [[Lookup-Tables]] – depends-on: an $\alpha$-input LUT *is* a $2^{\alpha}\times1$ ROM, which is why the LUT sets the unit of cost.
- [[Multipartite Methods]] – extends: splits the address into several narrower tables plus an adder, buying back most of the exponent.
- [[KCM, Table-Based Constant Multiplication]] – extends: the same tabulate-and-address idea applied to $a\times C$ with the address split by digits.
- [[Output Range Scaling]] – supports: tabulate $(1-2^{\ell})f$ so the discrete image never reaches the unrepresentable top of the format; used in the RTL above.
- [[Output Format Widening]] – supports: one extra output MSB instead, exact but with half the output range unused.
- [[Saturating Output Clamp]] – supports: clamp the overflowing entries, at nearly 1 ulp of error on them.
- [[Round-Down Table Fill]] – supports: fill with $\mathrm{RD}(f)$ so the top entry cannot round up, doubling the error budget.
- [[Tabulated Reciprocal]] – supports: the worked case exploiting output precision $\gg$ input precision.
- [[Modular Squaring Table]] – supports: the wildly discontinuous case that only tabulation can approximate at all.
- [[Residual-Sign Rounding Unit]] – counter-example: for algebraic $f$, correct rounding comes from the sign of a residual instead of from a table.
- [[Rounding]] – depends-on: which rounding the fill code applies is the only choice that distinguishes two otherwise identical ROMs.
- [[FloPoCo]] – supports: `FixFunctionByTable` is this circuit's generator; Sollya evaluates the entries with a guaranteed bound.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 16, "Generalities on Fixed-Point Function Approximation":

- §16.3.2 Elementary and Special Functions, p. 488 — correct rounding restricted to $\le24$ bits by exhaustive enumeration.
- §16.4 A First Generic Approximator: Simple Tabulation, p. 488 — the one-item requirement list; no architectural overhead for correct rounding; Fig. 16.10, generator parameters.
- §16.4.1 Tabulating Precomputed Function Values in a ROM, pp. 489–491 — Sollya and guaranteed-accuracy evaluation; the four hands-on cases; "exponential in the input size, but only linear in the output size".
- §16.4.2 Actual Cost of a ROM, pp. 491–492 — eq. (16.1); ROM generators larger than standard cells; LUT cost $2^{\max(k-\alpha,0)}\times n$ and the measured 25-LUT sine table; Fig. 16.11.
