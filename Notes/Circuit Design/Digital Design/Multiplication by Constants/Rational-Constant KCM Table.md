---
title: "Rational-Constant KCM Table"
description: "For a rational coefficient the KCM table is itself eventually periodic, so a 22-bit-wide table collapses to about alpha+s LUTs."
kind: circuit
source: "ASA §12.4.3, p. 401"
status: seed
spade: simulated
tags: [digital, multiplication-by-constants, kcm, rational, periodicity, lut, fpga]
aliases:
  - Table-Based Multiplication by Rational Constants
  - Table-Based Rational Multiplication
  - Periodic KCM Table
  - Rational KCM
---

# Rational-Constant KCM Table

The KCM lookup table for a rational coefficient $A/B$, whose *columns* repeat with the period of $A/B$'s binary expansion, so the table costs about $\alpha+s$ LUTs rather than one LUT per output bit.

```tikz title="KCM table for the constant 1/3 with alpha = 4: the fractional columns repeat with period s = 2"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small,>=latex]
  % --- the two master columns, highlighted behind the grid ---
  \fill[blue!14]   (0.60,-2.32) rectangle (0.80,0.06);
  \fill[orange!22] (0.80,-2.32) rectangle (1.00,0.06);

  % --- table body: one cell per bit, filled = 1 ---
  \node[anchor=east,font=\scriptsize] at (-0.18,-0.09) {$0/3$};
  \foreach \b [count=\c] in {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-0.19) rectangle ++(0.20,0.19);
  \node[anchor=east,font=\scriptsize] at (-0.18,-0.37) {$1/3$};
  \foreach \b [count=\c] in {0,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-0.47) rectangle ++(0.20,0.19);
  \node[anchor=east,font=\scriptsize] at (-0.18,-0.65) {$2/3$};
  \foreach \b [count=\c] in {0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-0.75) rectangle ++(0.20,0.19);
  \node[anchor=east,font=\scriptsize] at (-0.18,-0.93) {$3/3$};
  \foreach \b [count=\c] in {0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-1.03) rectangle ++(0.20,0.19);
  \node[anchor=east,font=\scriptsize] at (-0.18,-1.21) {$4/3$};
  \foreach \b [count=\c] in {0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-1.31) rectangle ++(0.20,0.19);
  \node[font=\scriptsize] at (-0.42,-1.52) {$\vdots$};
  \node[font=\scriptsize] at (2.20,-1.52) {$\vdots$};
  \node[anchor=east,font=\scriptsize] at (-0.18,-1.83) {$14/3$};
  \foreach \b [count=\c] in {1,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-1.93) rectangle ++(0.20,0.19);
  \node[anchor=east,font=\scriptsize] at (-0.18,-2.11) {$15/3$};
  \foreach \b [count=\c] in {1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
    \path[fill=black,fill opacity=\b,draw=black!30,line width=0.2pt] ({(\c-1)*0.20},-2.21) rectangle ++(0.20,0.19);

  % --- binary point between integer and fractional columns ---
  \draw[very thick] (0.60,0.06) -- (0.60,-2.32);

  % --- row-address annotation ---
  \node[rotate=90,font=\scriptsize,anchor=south] at (-1.05,-1.15)
       {$16$ rows, $\alpha=4$ address bits};

  % --- top annotation ---
  \node[anchor=west] at (0.00,0.78) {$T(X_i)=X_i/3$ on $22$ bits};
  \draw (0.00,0.10) -- (0.00,0.30) -- (0.60,0.30) -- (0.60,0.10);
  \node[anchor=west,font=\scriptsize] at (0.72,0.30) {$3$ aperiodic columns, holding $\lfloor X_i/3\rfloor$};

  % --- bottom annotations: which columns are copies of which ---
  \foreach \k in {0,1,2,3,4,5,6,7,8,9}
    \draw[blue!70,line width=0.9pt] ({0.60+\k*0.40},-2.40) -- ({0.80+\k*0.40},-2.40);
  \node[anchor=west,font=\scriptsize,blue!70] at (4.52,-2.40) {col.\ $4$ (shaded) and its copies $\rightarrow$ $1$ LUT};
  \foreach \k in {0,1,2,3,4,5,6,7,8,9}
    \draw[orange!80!black,line width=0.9pt] ({0.80+\k*0.40},-2.62) -- ({1.00+\k*0.40},-2.62);
  \node[anchor=west,font=\scriptsize,orange!80!black] at (4.52,-2.62) {col.\ $5$ (shaded) and its copies $\rightarrow$ $1$ LUT};
  \node[anchor=west,font=\scriptsize] at (0.00,-2.95)
       {$22$ LUT-deep table $\;\longrightarrow\;$ $\alpha+s = 3+2 = 5$ distinct $4$-input LUTs, fanned out};
\end{circuitikz}
\end{document}
```

*after Fig. 12.18, p. 401*

**Fix what the table actually stores.** A [[KCM, Table-Based Constant Multiplication]] operator cuts the $w_X$-bit input $X$ into $\lceil w_X/\alpha\rceil$ digits $X_i$ of $\alpha$ bits and reads $C\,X_i$ out of a table addressed by $X_i$. The table is $2^{\alpha}$ rows deep and $w$ bits wide; on an [[FPGAs|FPGA]] each of its $w$ output bits is one $\alpha$-input LUT, because an $\alpha$-input LUT *is* a $2^{\alpha}\times 1$ table, so the naive cost is $w$ LUTs per digit. Take $C=A/B$ rational, irreducible, $A/B<1$, with $B$ odd — every factor of two is a hardwired shift and is pulled out as $2^{e}$ first (Lemma 12.1, p. 396), and an integer header $H$ from $A=HB+A'$ is handled by an ordinary constant multiplier. The stored value is then the fixed-point number $T(X_i)=X_iA/B$, truncated to $w-\alpha$ fractional bits ([[Number Formats]]).

**Split each row by Euclidean division and the denominator never changes.** Write $X_iA=q_iB+r_i$ with $0\le r_i<B$. Then

$$T(X_i)=q_i+\frac{r_i}{B},\qquad q_i=\left\lfloor \frac{X_iA}{B}\right\rfloor<2^{\alpha}$$

the bound because $A/B<1$ and $X_i<2^{\alpha}$. So the top $\alpha$ columns carry the integer $q_i$, and every row's fractional part is a fraction *with the same denominator $B$* — that is the whole observation, and it is what a table for an integer or an arbitrary real constant does not give you.

**The multiplicative order of $2$ makes every one of those fractions purely periodic with one common period.** Let $s=\operatorname{ord}_B(2)$, the least $s$ with $2^{s}\equiv1\pmod B$, which exists because $\gcd(2,B)=1$ (Lemma 12.2, p. 396). Write $2^{s}=kB+1$. Then for any $r<B$

$$2^{s}\cdot\frac{r}{B}=\frac{(kB+1)r}{B}=kr+\frac{r}{B},\qquad kr\in\mathbb{Z}$$

so $\operatorname{frac}(2^{s}r/B)=\operatorname{frac}(r/B)$: shifting the fractional expansion left by $s$ places reproduces it exactly. Since $r/B<1$ there is no aperiodic head to absorb, so the expansion is *purely* periodic and its fraction bits satisfy $f_{j+s}=f_j$ for every $j\ge1$. The period $s$ depends only on $B$, not on $r$ — every row of the table repeats on the same stride.

**Read that statement column-wise and it becomes a hardware count.** Column $j$ of the table is the function $X_i\mapsto f_j(X_i)$, i.e. the contents of one LUT. Because $f_{j+s}=f_j$ holds row by row, column $j+s$ is bit-for-bit column $j$: the *LUT contents are identical*, so one LUT drives every column congruent to $j$ modulo $s$. Only the $\alpha$ integer columns and the first $s$ fractional columns can differ, giving at most $\alpha+s$ distinct LUTs no matter how wide the table is. For $A/B=1/3$ and $\alpha=4$: $s=\operatorname{ord}_3(2)=2$ since $2^2=4\equiv1\pmod 3$, and $q_i=\lfloor X_i/3\rfloor\le5$ needs only $3$ columns, so a $22$-bit-wide table is $3+2=5$ distinct LUTs instead of $22$ — the book's figure. The two master columns are the two rotations of the pattern: $r_i=1$ gives $0.\overline{01}$, $r_i=2$ gives $0.\overline{10}$, $r_i=0$ gives zero.

**Nothing in the architecture has to ask for this.** Identical LUT contents are found by the mapper's structural hashing during technology mapping, so the HDL describes $w$ independent output bits and the tool merges them; the note-worthy consequence is that you should *not* try to express the sharing by hand, and should not be surprised when the reported LUT count is far below the table width. On an ASIC the table is random logic rather than LUTs, and ordinary common-subexpression elimination extracts the same repeated cone — the saving is real, it is just not measured in LUTs.

**The saving is bounded, and bounded on the side that matters least.** It shrinks tables, not the KCM addition hardware: the operator still sums $\lceil w_X/\alpha\rceil$ shifted $w$-bit table outputs, and the shared LUT is *fanned out* to all its columns, so the adder tree sees full-width words exactly as before (p. 401). Since KCM cost is dominated by those adders once $w_X$ grows, the periodicity is a constant-factor win on the cheap part.

$$\boxed{\ T(X_i)=\underbrace{\left\lfloor\tfrac{X_iA}{B}\right\rfloor}_{\alpha\ \text{aperiodic columns}}+\underbrace{\frac{X_iA \bmod B}{B}}_{\text{purely periodic, period } s=\operatorname{ord}_B(2)}\quad\Longrightarrow\quad \#\text{LUT}\approx\alpha+s\ \text{ instead of } w\ }$$

**When it breaks.**

- $s$ is the multiplicative order of $2$ modulo $B$, which for prime $B$ divides $B-1$ and often *equals* it — $B=11$ gives $s=10$, $B=13$ gives $s=12$. Once $\alpha+s\ge w$ the table is not compressible at all, so the optimisation is a small-denominator phenomenon (p. 400).
- $B$ even or $\gcd(A,B)\ne1$ breaks the "same denominator" step; reduce and factor out $2^{e}$ first, or the columns simply are not copies.
- $A/B>1$: the header $H$ from $A=HB+A'$ must be split off, otherwise $q_i$ needs more than $\alpha$ columns and the aperiodic head grows.
- The argument above assumes the table is **truncated**. Round-to-nearest tables add a half-ulp before truncating, and that carry is row-dependent, so the columns nearest the LSB stop being exact copies of their period-mates.

> [!warning] Not covered in the source — needs outside research
> §12.4.3 states the $\alpha+s$ count for truncated tables only. Whether the sharing survives round-to-nearest table filling, and how many low columns it costs, is not analysed there. See [[Rounding]] for the rounding modes themselves.

- The regime where $s$ is small is exactly the regime where a dedicated divider wins: for $B\in\{3,5\}$, [[Division by Constants]] specialisations usually beat multiplying by the reciprocal (p. 401).

```spade
// The alpha aperiodic MSB columns: floor(X/3), 3 bits because X/3 < 6.
fn int_cols(x: uint<4>) -> uint<3> {
    match x {
        0 => 0,  1 => 0,  2 => 0,
        3 => 1,  4 => 1,  5 => 1,
        6 => 2,  7 => 2,  8 => 2,
        9 => 3, 10 => 3, 11 => 3,
       12 => 4, 13 => 4, 14 => 4,
        _ => 5,
    }
}

// The s = 2 distinct fractional columns, selected by r = X mod 3:
// r = 0 -> .000...,  r = 1 -> .0101...,  r = 2 -> .1010...
fn frac_cols(x: uint<4>) -> (bool, bool) {
    match x {
         0 => (false, false),  3 => (false, false),  6 => (false, false),
         9 => (false, false), 12 => (false, false), 15 => (false, false),
         1 => (false, true),   4 => (false, true),   7 => (false, true),
        10 => (false, true),  13 => (false, true),
         _ => (true, false),
    }
}

// One row of the KCM table for A/B = 1/3, alpha = 4, 22-bit entries.
fn kcm_third_row(x: uint<4>) -> uint<22> {
    let q = int_cols(x);
    let (f1, f2) = frac_cols(x);
    // index 0 = LSB, so even index -> f1, odd index -> f2
    let frac = [f1, f2, f1, f2, f1, f2, f1, f2, f1, f2,
                f1, f2, f1, f2, f1, f2, f1, f2, f1];
    q.concat(frac.as_uint())
}

entity kcm_third(x: uint<4>) -> uint<22> {
    kcm_third_row(x)
}
```

`x` is one $\alpha=4$-bit digit $X_i$ — the row address down the left of the diagram; the `uint<22>` result is one row of the grid, MSB first, with `concat` placing the $3$ integer columns above the $19$ fractional ones (for integers `x.concat(y)` puts `x` high). `int_cols` and `frac_cols` are the only five bits of real logic: `frac_cols` returns the two master columns and the 19-element array is pure fanout, which is exactly the shape a mapper arrives at on its own. Everything is combinational, no clock; synthesis will not keep this as two ROMs and a replication — it flattens the whole thing into five 4-input LUTs whose contents are the five distinct columns.

- [[KCM, Table-Based Constant Multiplication]] – depends-on: this is a property of that operator's table; the digit split, the shifts and the final addition are unchanged.
- [[Periodic Shift-and-Add Rational Constant Multiplier]] – compares: same periodicity of $A/B$, spent on a logarithmic adder graph instead of on the table contents.
- [[Table-Based Multiple Constant Multiplication]] – extends: the same "identical LUT contents" sharing, but *between* constants rather than within one constant's table.
- [[Division by Constants]] – counter-example: for the small denominators where $s$ is short enough to matter, a dedicated division-by-constant circuit is usually the better operator.
- [[Choosing a Constant Multiplier]] – compares: where a KCM sits against shift-and-add and DSP-block alternatives once this table saving is counted.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §12.4.3 "Table-Based Multiplication by Rational Constants" and Fig. 12.18, p. 401.
- Lemmas 12.1 and 12.2 (pure periodicity, $s=\operatorname{ord}_B(2)$), p. 396; the small-denominator caveat, p. 400.
- §12.2.2, KCM tables and their LUT mapping, pp. 384-385.
