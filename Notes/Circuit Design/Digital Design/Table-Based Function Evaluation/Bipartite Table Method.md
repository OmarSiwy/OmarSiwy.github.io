---
title: Bipartite Table Method
description: "Replaces one 2^w_X ROM with a table of initial values plus a table of tabulated offsets and one adder — piecewise linear interpolation with the multiplier deleted, at alpha ~ 2w_X/3."
kind: circuit
source: "ASA §17.2.2, pp. 504-506"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, bipartite, rom, interpolation, fpga]
aliases:
  - Bipartite Table
  - Bipartite Tables
  - Bipartite Method
  - Bipartite Approximation
  - Bipartite Table Lookup
  - Das Sarma-Matula Method
---

# Bipartite Table Method

Two tables and one adder evaluate a smooth $f$ to a faithful result: a table of initial values addressed by the $\alpha$ high bits of the input and a table of *pre-multiplied* offsets addressed by $\gamma+\beta$ bits — the only piecewise-linear scheme with no multiplier in it, because the product it would compute has been tabulated instead.

```tikz title="Bipartite datapath for w_X = 8: the input word split into C, A, B, one table of initial values, one table of offsets, one 9-bit adder, and a free final truncation"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
% ---- input word: 8 cells of 1cm ----
\draw[thick] (0,4.3) rectangle (8,4.9);
\foreach \i in {1,...,7} \draw[gray] (\i,4.3) -- (\i,4.9);
\draw[very thick] (5,4.3) -- (5,4.9);
\draw[very thick,densely dashed] (3,4.3) -- (3,4.9);
\node[font=\small] at (-0.9,4.6) {$X=$};
\node[font=\tiny] at (1.5,5.15) {$C$ ($\gamma=3$)};
\node[font=\tiny] at (4.0,5.15) {rest of $A$};
\node[font=\tiny] at (6.5,5.15) {$B$ ($\beta=3$)};
\draw[<->,gray] (0,4.05) -- node[below,font=\tiny]{$\alpha=5$} (5,4.05);
\draw[<->,gray] (5,4.05) -- node[below,font=\tiny]{$\beta=3$} (8,4.05);
% ---- the two tables ----
\node[draw,thick,minimum width=3.4cm,minimum height=1.3cm,align=center] (tiv) at (1.6,2.0)
  {TIV: $f$ at segment centre\\[-3pt]{\tiny $2^{\alpha}=32$ entries $\times\ 9$ bits}};
\node[draw,thick,minimum width=3.4cm,minimum height=1.3cm,align=center] (to) at (6.4,2.0)
  {TO: $s(C)\cdot 2^{-\alpha}B$\\[-3pt]{\tiny $2^{\gamma+\beta}=64$ entries $\times\ 4$ bits}};
% ---- address wiring ----
\draw[->] (1.6,4.3) -- node[left,font=\tiny]{$\alpha=5$} (1.6,2.65);
\draw[->] (0.5,4.9) -- (0.5,5.75) -- node[above,font=\tiny]{$\gamma=3$, the MSBs of $A$} (9.3,5.75)
          -- (9.3,3.1) -- (5.9,3.1) -- (5.9,2.65);
\draw[->] (6.9,4.3) -- node[right,font=\tiny]{$\beta=3$} (6.9,2.65);
% ---- adder ----
\node[draw,thick,minimum width=7.6cm,minimum height=0.7cm] (add) at (4.0,0.5) {$+$\quad 9 bits};
\draw[->] (1.6,1.35) -- node[left,font=\tiny]{$w_R+g=9$} (1.6,0.85);
\draw[->] (6.4,1.35) -- node[right,font=\tiny]{$m_0-\ell_R+g=4$, signed} (6.4,0.85);
% ---- final truncation ----
\node[draw,thick,minimum width=2.4cm,minimum height=0.6cm] (rnd) at (4.0,-1.0) {truncate 1 bit};
\draw[->] (4.0,0.15) -- node[right,font=\tiny]{$S(X)$ at $2^{\ell_R-g}=2^{-9}$} (4.0,-0.7);
\draw[->] (4.0,-1.3) -- node[right,font=\tiny]{$w_R=8$} (4.0,-2.1) node[below,font=\small]{$R(X)$};
\node[font=\tiny,align=center] at (4.0,-3.1)
  {$g=1$ guard bit is carried through the sum; the final rounding is free because\\
   the half-ulp $2^{\ell_R-1}$ was pre-added into every TIV entry at fill time};
\end{circuitikz}
\end{document}
```

*after Fig. 17.4, p. 504 and Fig. 17.7, p. 506 — drawn for the $w_X=8$ instance worked below rather than the book's abstract $\alpha=4,\beta=2,\gamma=2$.*

**Split the input word, because that split is free.** The input is one unsigned fixed-point $X\in[0,1)$ of $w_X$ bits with $\ell_X=-w_X$ ([[Number Formats]]); the output $R(X)$ has LSB $\ell_R$ and $w_R=m_R-\ell_R+1$ bits, and the target is *faithful* — $|R(X)-f(X)|<2^{\ell_R}$, one ulp total ([[Error Accuracy]]). Cut $X$ into an $\alpha$-bit head and a $\beta$-bit tail with $\alpha+\beta=w_X$:

$$X = A + 2^{-\alpha}B,\qquad A\in 2^{-\alpha}\mathbb{Z}\cap[0,1)\ \text{on}\ \alpha\ \text{bits},\quad B\in[0,1)\ \text{on}\ \beta\ \text{bits}$$

$A$ and $B$ are slices of the input word, so the decomposition is wiring and costs nothing. Everything below is about which slice addresses which table.

**Taylor at $A$ puts a floor under $\alpha$ that no architecture can lift.** Expand with the remainder in Lagrange form:

$$f(A+2^{-\alpha}B)=f(A)+2^{-\alpha}B\,f'(A)+\tfrac12\left(2^{-\alpha}B\right)^2 f''(\xi),\qquad \xi\in(A,X)$$

The quadratic term is bounded by $\tfrac12 2^{-2\alpha}\max|f''|$ since $B<1$. Forcing that under the half-ulp share $2^{\ell_R-1}$, with $\ell_R\approx-w_X$, gives $\alpha\gtrsim w_X/2$. This is a statement about Taylor's theorem, not about a circuit: **every order-one scheme that tabulates values at $2^\alpha$ points inherits it**, which is why the escape route is order two ([[Polynomial Approximation]]) and not a cleverer table.

**Truncating the series to two terms buys a multiplier you did not want.** Keep $f(A)+2^{-\alpha}B\,f'(A)$ and you have a *uniform piecewise linear approximation*: one table of $2^\alpha$ values, one table of $2^\alpha$ slopes, and a multiplier to combine them. The multiplier is the whole objection — this family exists to avoid it, and a $w_R\times\beta$ multiplier plus two $2^\alpha$-entry tables is worse than the plain $2^{w_X}$ ROM it was meant to replace at exactly the sizes where the ROM hurts.

**Degrade the slope deliberately, and the product becomes tabulatable.** The premise "$f''$ bounded" already says $f'$ varies slowly, so round $A$ down to its $\gamma$ most significant bits, call that $C$ with $\gamma<\alpha$, and use one slope $s(C)$ for the whole group of $2^{\alpha-\gamma}$ consecutive segments. **By the mean value theorem applied to $f'$** over an interval of width $2^{-\gamma}$, the extra error is

$$\left|2^{-\alpha}B\left(f'(A)-s(C)\right)\right| \;\le\; 2^{-\alpha}\cdot 2^{-\gamma}\max|f''|$$

and holding it under $2^{\ell_R-1}$ asks for $\alpha+\gamma\gtrsim w_X$.

> [!important] The decoupling is the whole trick
> The value table needs $\alpha$ address bits; the slope table needs only $\gamma<\alpha$, because the slope moves more slowly than the value. And once the slope depends on $C$ alone, the product $s(C)\times 2^{-\alpha}B$ takes only $2^{\gamma+\beta}$ distinct values — **so tabulate the product rather than the slope, and the multiplier vanishes with it.**
> $$f(X)\;\approx\;\underbrace{f(A)}_{\text{TIV},\;2^{\alpha}\ \text{entries}}\;+\;\underbrace{s(C)\times 2^{-\alpha}B}_{\text{TO},\;2^{\gamma+\beta}\ \text{entries}}$$
> **TIV** = table of initial values, **TO** = table of offsets. One exponential table became two smaller ones and one addition.

**Balance the two exponentials to size the split.** Minimise $2^{\alpha}+2^{\gamma+\beta}$ under the two constraints taken tight — $\alpha+\beta=w_X$ because the split is exhaustive, $\alpha+\gamma=w_X$ from the accuracy bound. The second forces $\gamma=\beta$, so the cost is $2^\alpha+2^{2(w_X-\alpha)}$, minimised where the exponents meet:

$$\alpha=2(w_X-\alpha)\quad\Longrightarrow\quad \alpha\approx\tfrac{2w_X}{3},\qquad \beta\approx\gamma\approx\tfrac{w_X}{3}$$

which reproduces the rule of thumb earlier authors got from a Taylor analysis (p. 506), and comfortably satisfies $\alpha\ge w_X/2$. Entry count falls from $2^{w_X}$ to $\approx 2\cdot2^{2w_X/3}$, a factor $2^{w_X/3}/2$ that grows exponentially with precision. Treat these as starting points: the real parameters come out of an exhaustive search, because $\max|f''|$ and the output range enter the constants.

**Buy the last fraction of an ulp with guard bits.** Rounding each table to $\ell_R$ would spend $2^{\ell_R-1}$ per table and blow the budget on the second one, so both tables are filled to $\ell_R-g$ and the adder is $g$ bits wider. The three-way split of the ulp — approximation, table filling, final rounding — and the resulting $g$ belong to [[HUB Table Filling]]; the one consequence visible here is that the sum $S(X)$ is $w_R+g$ bits and the output is its top $w_R$, a **pure truncation with no hardware**, because the half-ulp $2^{\ell_R-1}$ was folded into every TIV entry at fill time ([[Rounding]]).

**Size the worked instance: $f=\sin(\pi x/4)$ on $[0,1)$, $w_X=8$, $\ell_X=\ell_R=-8$.** The range is $[0,0.7071)$ so $m_R=-1$ and $w_R=8$. The rule of thumb gives $\alpha\approx5.3$, $\beta\approx\gamma\approx2.7$; the search settles on $\alpha=5$, $\beta=\gamma=3$, and $\overline{\delta_{\text{approx}}}=0.0678$ ulp yields $g=1$. The TIV holds $2^5=32$ entries of $w_R+g=9$ bits. The TO's range is $r_0=\max_C|s(C)\Delta_0|=0.02144$ with $\Delta_0=2^{\ell_X}(2^\beta-1)=7/256$, so $m_0=\lceil\log_2 r_0\rceil=-5$ and each entry is $m_0-\ell_R+g=4$ signed bits over $2^{\gamma+\beta}=64$ addresses. That is $288+256=544$ table bits against $2^8\times8=2048$ for the plain ROM — a factor $3.8$ — falling to $416$ bits and a factor $4.9$ once [[Symmetric Table of Offsets]] halves the TO by storing only $B\ge2^{\beta-1}$ and complementing the rest.

**Trace one input to see the datapath move.** $X=\mathtt{00101101}=45/256$ splits as $A=\mathtt{00101}=5$, $B=\mathtt{101}=5$, $C=\mathtt{001}=1$. With the tables in units of $2^{\ell_R-g}=2^{-9}$: $\mathrm{TIV}[5]=69$, $\mathrm{TO}[1,5]=+2$, $S=71$, and truncating one bit gives $R=35$. The exact value is $2^8\sin(\pi\cdot45/1024)=35.2308$, so the error is $-0.231$ ulp. Exhaustively over all $2^8$ inputs the worst case is $X=\mathtt{01001000}=72$, where $B=0$ sits at a segment boundary — exactly where the balanced-error construction parks the excursion — giving $R=57$ against $56.0899$.

**On an FPGA, count LUTs rather than bits — and note that small tables are free.** With $\lambda$-input [[Lookup-Tables]] a $2^k\times n$ table costs $2^{\max(k-\lambda,0)}n$ LUTs, so on a $\lambda=6$ device the 8-bit instance is $9+4=13$ LUTs plus a 9-bit carry chain, against $2^{2}\times8=32$ LUTs for the plain ROM. Two things the bit count does not show. Synthesis shares sub-expressions between output bits, so the formula overestimates — that same plain $2^8\times8$ sine ROM measures 25 LUTs, not 32 — and any $2^k$ with $k\le\lambda$ costs $n$ LUTs whatever $k$ is, so **shrinking $\gamma$ or $\beta$ below the LUT input count saves nothing at all**, an effect invisible in a cost function counting bits. Higher up, once the plain ROM fits in block memory it costs no fabric and the comparison inverts again. On an ASIC there is no architectural $\lambda$: both tables are synthesised logic, the trade is logic area against one adder, and the crossover moves without the shape of the argument changing ([[FPGAs]]).

$$\boxed{\ f(X)\approx\mathrm{TIV}(A)+\mathrm{TO}(C,B),\qquad \alpha\approx\tfrac{2w_X}{3},\quad \beta=\gamma\approx\tfrac{w_X}{3},\quad \text{cost}\approx 2\cdot 2^{2w_X/3}\ \text{entries}\ }$$

**When it breaks.**

- $\max|f''|=\infty$. $\sqrt{x}$ on $[0,1)$ has a vertical tangent at $0$ and the mean-value bound above evaporates. The fix is function-specific [[Range Reduction]] — evaluate on $[1,2)$ and transport to $2(\sqrt{1+x}-1)$ on $[0,1)$ — not a parameter change.
- $w_X\lesssim10$. The plain ROM is one table read — correctly rounded, monotonic for free, no adder and no error analysis. Bipartite already halves the LUT count at $w_X=8$, but it buys that with a carry chain in the critical path and a faithful-only result; the ROM is usually still the right answer. [[Fixed-Point Function Approximation]] is where that comparison is set up.
- The plain ROM fits in spare block RAM. Then it costs no logic at all and two tables plus an adder is a strict regression, whatever the bit counts say.
- $w_X\gtrsim16$. The TO stops being the problem and the $2^{\alpha}$ TIV dominates; splitting the TO into $m$ tables ([[Multipartite Methods]]) and compressing the TIV losslessly ([[Multipartite with Compressed TIV]]) both attack it, and bipartite is just the $m=1$ corner of that family.
- $w_X\gtrsim24$. $\alpha\gtrsim w_X/2$ makes the TIV exponential again and no order-one method survives; order two relaxes the bound to $\alpha\gtrsim w_X/3$, which is worth a squarer or a DSP block ([[Polynomial Approximation]]).
- Monotonicity is not delivered. Faithfulness admits two legal outputs at most points, and the error is deliberately balanced to $\pm\delta$ at the segment boundary, which is precisely where a step backwards appears. The 8-bit instance here happens to be monotonic — checked exhaustively, not guaranteed. [[Monotonic Multipartite Tables]] is the price list for demanding it.

**RTL (Spade).** The worked instance, tables filled by the equations above.

```spade
/// Table of initial values: f at the centre of each of the 2^alpha = 32 segments,
/// in units of 2^(l_R - g) = 2^-9, with the half-ulp 2^(l_R-1) already folded in.
fn tiv(a: uint<5>) -> uint<9> {
    let t: [uint<9>; 32] = [
        6, 19, 32, 44, 57, 69, 82, 94,
        106, 119, 131, 143, 155, 167, 179, 190,
        202, 213, 225, 236, 247, 258, 269, 280,
        290, 300, 310, 320, 330, 340, 349, 358
    ];
    t[a]
}

/// Table of offsets: s(C) * 2^-8 * (B - 3.5), same 2^-9 units, signed, 4 bits.
/// 2^(gamma+beta) = 64 entries; halving it by symmetry is a separate note.
fn to(cb: uint<6>) -> int<4> {
    let t: [int<4>; 64] = [
        -5, -4, -2, -1, 1, 2, 4, 5,
        -5, -4, -2, -1, 1, 2, 4, 5,
        -5, -4, -2, -1, 1, 2, 4, 5,
        -5, -4, -2, -1, 1, 2, 4, 5,
        -5, -4, -2, -1, 1, 2, 4, 5,
        -5, -3, -2, -1, 1, 2, 3, 5,
        -4, -3, -2, -1, 1, 2, 3, 4,
        -4, -3, -2, -1, 1, 2, 3, 4
    ];
    t[cb]
}

/// Bipartite sin(pi x / 4) on [0,1): w_X = w_R = 8, alpha = 5, beta = gamma = 3, g = 1.
entity bipartite_sin8(x: uint<8>) -> uint<8> {
    let b  = x.as_bits();
    let a  = b[3..8].as_uint();                  // A: the alpha = 5 MSBs
    let cb = b[0..3].concat(b[5..8]).as_uint();  // C || B: gamma + beta = 6 address bits
    let off: int<9> = sext(to(cb));              // sign-extend the offset to the adder width
    let s: uint<9> = tiv(a) +. off.as_uint();    // one 9-bit adder, wraps by two's complement
    s.as_bits()[1..9].as_uint()                  // drop the g = 1 guard bit: pure truncation
}
```

`tiv` and `to` are the two boxes in the diagram, and the two slicings are the two brackets on the input word: `b[3..8]` is $A$ (`as_bits` indexes from the LSB, so this is the top five bits) and `b[0..3].concat(b[5..8])` is $C\Vert B$, six address bits assembled with $B$ low — array `concat` puts its left argument in the *low* half, the opposite of the integer convention, and getting it backwards yields a circuit that compiles and interpolates on the wrong segment. The adder is the truncating `+.` on `uint<9>` after sign-extending the 4-bit offset: $S=\mathrm{TIV}+\mathrm{TO}$ is provably in $[0,2^9)$, so the wrap-around of two's-complement addition is the correct 9-bit adder and the growth `+` would give is dead. Everything is combinational; synthesis will not build the two tables and the [[RCA, Ripple-Carry Adder]] separately as drawn — on an FPGA it merges table outputs into the carry-chain LUT row, and on an ASIC it shares logic between the two tables' output bits.

Simulated exhaustively against a correctly rounded reference: **all $2^8$ inputs faithful**, plus 3000 random codes and five named vectors, $\max_X|\delta_{\text{total}}|=0.9101$ ulp at $X=72$, and monotonic over the whole domain.

$$\max_X|\delta_{\text{total}}|=0.9101\ \text{ulp}<1\ \text{ulp}$$

> [!warning] The long-form note's boxed maximum is the second-worst case
> [[Table-Based Function Evaluation]] reports $\max|\delta_{\text{total}}|=0.9076$ ulp at $X=\mathtt{00100000}$. That is the correct error *at that input*, but the exhaustive maximum over all 256 codes is $0.9101$ ulp at $X=\mathtt{01001000}$ ($A=9$, $B=0$, $C=2$, $\mathrm{TIV}=119$, $\mathrm{TO}=-5$, $R=57$ against $56.0899$). Both are under one ulp, so the faithfulness claim stands; the number does not. Re-measured here over all $2^8$ inputs and in simulation.

> [!warning] Filling the TO by round-to-nearest is not the book's choice, and here it is the worse one
> The values tabulated above are round-to-nearest, matching the long-form note. HUB truncation — store $\lfloor 2^{-\ell_R+g}\mathrm{TO}^*\rfloor$ with an implicit $1$ below — is what [[HUB Table Filling]] and [[Symmetric Table of Offsets]] actually want, because the opposite of a HUB number is its bitwise complement. Re-measured on this instance it also *reduces* the exhaustive maximum error to $0.7436$ ulp. Whether that ordering holds in general is not addressed in the source.

**Related notes.**

- [[Fixed-Point Function Approximation]] – depends-on: fixes the input/output formats, the faithfulness target, and the plain ROM this is measured against.
- [[Multipartite Methods]] – extends: splits the TO into $m$ tables with a slope each; bipartite is the $m=1$ member and the rest of the family is a search over decompositions.
- [[Symmetric Table of Offsets]] – extends: halves the TO for two rows of XOR gates, taking the worked instance from 544 to 416 table bits.
- [[HUB Table Filling]] – supports: supplies $g$, the three-way ulp budget, and the pre-added half-ulp that makes the final rounding a truncation.
- [[Multipartite with Compressed TIV]] – extends: attacks the $2^\alpha$ TIV, which is the dominant term as soon as $w_X$ passes about 12.
- [[Monotonic Multipartite Tables]] – counter-example: faithful is not monotone, and the balanced-error slope is exactly what breaks monotonicity at a segment boundary.
- [[Range Reduction]] – depends-on: the only repair when $\max|f''|$ is unbounded, as for $\sqrt{x}$ near zero.
- [[Polynomial Approximation]] – compares: order two moves the intrinsic bound from $\alpha\gtrsim w_X/2$ to $\alpha\gtrsim w_X/3$, at the price of a multiplier.
- [[Lookup-Tables]] – depends-on: turns table bits into LUT counts, and explains why the 8-bit instance loses to a plain ROM on an FPGA.
- [[RCA, Ripple-Carry Adder]] – supports: the single $w_R+g$-bit addition that is the entire non-table cost.
- [[Choosing a Table Method]] – compares: where this sits against LDTC, multipartite and the ATA family across $w_X$.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, §17.2.2 "The Basic Bipartite Method", pp. 504-506 — Fig. 17.4 (input word decomposition), Figs. 17.5-17.6 (the piecewise-linear approximation and its degradation, $\alpha=4$, $\gamma=2$), Fig. 17.7 (the abstract two-table architecture), and the $\gamma\approx\beta\approx w_X/3$, $\alpha\approx2w_X/3$ rule of thumb attributed to [Mul99] and [SS99b].
- §17.2 opening, p. 503 — the independent inventions by Das Sarma and Matula [DM95] for the reciprocal and Sunderland et al. [Sun+84] for the sine.
- §17.2.1, p. 503 and Fig. 17.3 — continuity, differentiability and bounded derivative as the applicability conditions, with the $\sqrt{x}$ counter-example.
- §17.2.3, p. 507 and Fig. 17.8 — the symmetry that halves the TO.
- §17.2.5.3, p. 516, Eq. (17.33) — the guard-bit count; §17.2.6, pp. 516-517, Eqs. (17.34)-(17.35) — the TO width $m_i-\ell_R+g$; §17.2.7, pp. 517-518, Eqs. (17.36)-(17.38) — HUB filling and the free final truncation.
- §17.2.12, p. 523 — the $\alpha\gtrsim w_X/2$ bound for order one and $\alpha\gtrsim w_X/3$ for order two.
- §16.4.2, pp. 491-492, Eq. (16.1) — the ASIC and FPGA table cost models used in the LUT comparison.
- Tables, slopes, guard bits, both diagrams' numbers and the RTL were recomputed here and checked exhaustively over all $2^8$ inputs.
