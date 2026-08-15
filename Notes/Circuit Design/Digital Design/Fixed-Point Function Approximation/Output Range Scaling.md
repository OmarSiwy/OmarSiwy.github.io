---
title: Output Range Scaling
description: "Tabulate (1-2^l)·f instead of f so the image lands inside the format — free, generic, still perfectly rounded, but against a modified function, so ~1.5 ulp against the original."
kind: circuit
source: "ASA §16.2.1, pp. 481-484"
status: seed
spade: simulated
tags: [digital, fixed-point-function-approximation, rounding, table, range]
aliases:
  - Output Scaling
  - Range Scaling
  - Scaling the Tabulated Function
---

# Output Range Scaling

Shrink the tabulated function by the factor $1-2^{\ell}$ before rounding it, so that the discrete image is pulled one ulp below the top of the output format — the only fix for the range problem that changes no hardware at all, paying in accuracy rather than in bits or gates.

```tikz title="Output range scaling of sin(pi/2 x) on a 4-bit fixed-point format"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[x=7.0cm,y=5.6cm,>=latex,font=\small]
  % the top row of the output format, which the scaling makes unreachable
  \fill[blue!10] (0,0.9375) rectangle (1.0,1.0);
  \draw[gray!22,step=0.0625] (0,0) grid (1,1);
  \draw[blue!55!black,dashed] (0,0.9375) -- (1.0,0.9375);
  \node[anchor=west,font=\scriptsize,blue!55!black] at (0.03,0.968)
      {$1$ ulp of head-room: unreachable};
  % the function the user asked for -- its rounded image reaches 16/16
  \draw[red!55,thick,dashed,domain=0:1,samples=120,variable=\x]
      plot ({\x},{sin(90*\x)});
  % the function actually tabulated
  \draw[red,very thick,domain=0:1,samples=120,variable=\x]
      plot ({\x},{0.9375*sin(90*\x)});
  \foreach \i/\r in {0/0,1/1,2/3,3/4,4/6,5/7,6/8,7/10,8/11,9/12,10/12,11/13,12/14,13/14,14/15,15/15}
      \fill[blue!60!black] ({\i/16},{\r/16}) circle (1.5pt);
  % legend, in the empty region under the curve
  \draw[red!55,thick,dashed] (0.42,0.34) -- (0.50,0.34);
  \node[anchor=west,font=\scriptsize] at (0.51,0.34) {$f=\sin(\tfrac{\pi}{2}x)$, requested};
  \draw[red,very thick] (0.42,0.22) -- (0.50,0.22);
  \node[anchor=west,font=\scriptsize] at (0.51,0.22) {$(1-2^{\ell})f$, tabulated};
  \fill[blue!60!black] (0.46,0.10) circle (1.5pt);
  \node[anchor=west,font=\scriptsize] at (0.51,0.10) {$\widetilde f(X)=\mathrm{RN}\big((1-2^{\ell})f(X)\big)$, 4 bits};
  % axes
  \draw[->] (0,0) -- (1.06,0) node[right,font=\scriptsize] {$X$, 4 bits};
  \draw[->] (0,0) -- (0,1.06);
  \node[anchor=east,font=\scriptsize] at (-0.012,1.008) {$1$};
  \node[anchor=east,font=\scriptsize] at (-0.012,0.922) {$1-u=\tfrac{15}{16}$};
  \node[anchor=east,font=\scriptsize] at (-0.012,0.5)   {$\tfrac{8}{16}$};
  \node[anchor=east,font=\scriptsize] at (-0.012,0)     {$0$};
  \node[anchor=north,font=\scriptsize] at (0.9375,-0.012) {$\tfrac{15}{16}$};
  \node[anchor=north,font=\scriptsize] at (0.42,-0.075)
      {$X\in\mathrm{ufix}(-1,-4)$, output $\mathrm{ufix}(-1,-4)$, $u=2^{-4}$};
\end{circuitikz}
\end{document}
```

*After Fig. 16.6d, p. 483.*

**Name the failure precisely, because the fix is aimed at one inequality.** A fixed-point output format $\mathrm{ufix}(m_{\text{out}},\ell)$ with $u=2^{\ell}$ holds the values $[\,0,\;2^{m_{\text{out}}+1}-u\,]\cap u\mathbb{Z}$ — see [[Number Formats]]. The format is a legal choice for $f$ only if

$$\max_{X\in\mathbb{F}_{\text{in}}}\;\mathrm{RN}\big(f(X)\big)\;\le\;2^{\,m_{\text{out}}+1}-u,$$

where the maximum runs over the $2^{w_X}$ points of the input format, **not** over the continuous range of $f$. For $f=\sin(\tfrac{\pi}{2}x)$ on $[0,1)$ with $w_X=4$ and both formats $\mathrm{ufix}(-1,-4)$, the continuous supremum is $1$ and is never attained, so the format looks safe; but $\mathrm{RN}$ pushes $X=\tfrac{14}{16}$ and $X=\tfrac{15}{16}$ up to $\tfrac{16}{16}$, which encodes as the 5-bit word $10000_2$ and, by the modulo property of fixed-point arithmetic, truncates to $0000_2$. The largest value of the image becomes the smallest. Output range scaling attacks the left-hand side of that inequality; its three siblings attack the right-hand side or the rounding operator.

**Shrink the function instead of growing the format.** Fill the table with $g=s\,f$ for a generation-time constant $s<1$ rather than with $f$. When the output format is $\mathrm{ufix}(-1,\ell)$ and $f$ is bounded by $1$ on the domain, the natural choice is
$$s\;=\;1-2^{\ell}\;=\;1-u,$$
which is exactly the largest representable value of that format — $\tfrac{15}{16}$ at $\ell=-4$, $\tfrac{255}{256}$ at $\ell=-8$. Nothing about the sine is used; the factor depends only on the output format.

**Prove the overflow is impossible rather than merely improbable.** $\mathrm{RN}$ is a non-decreasing map $\mathbb{R}\to\mathbb{F}$, and it is the identity on $\mathbb{F}$. For every $X$, $g(X)=(1-u)f(X)\le 1-u$ because $f\le1$; applying monotonicity of $\mathrm{RN}$ and then idempotence at the representable point $1-u$,
$$\mathrm{RN}\big(g(X)\big)\;\le\;\mathrm{RN}(1-u)\;=\;1-u,$$
which is the format-correctness condition, satisfied for **every** input at once. This is why the technique is the generic one: it needs a bound on $f$ and nothing else — no smoothness, no knowledge of where the maximum sits, no per-input case analysis. The same argument reruns unchanged for round-up and round-down, since all three are non-decreasing.

**Account for the ulp you just spent.** Two independent errors compose. The table is still *perfectly* rounded — the fill code does not care which function it evaluates, so $|\widetilde f(X)-g(X)|\le\tfrac12 u$ by the definition of $\mathrm{RN}$. The scaling itself contributes
$$\big|f(X)-g(X)\big|\;=\;2^{\ell}\,\lvert f(X)\rvert\;\le\;2^{\ell}\;=\;u,$$
using $|f|\le1$. By the triangle inequality the total against the *original* $f$ is at most $\tfrac32 u$. The book states the same bound as "close to 1.5 ulp" (p. 483). Note what changed in kind: the operator remains correctly rounded, but with respect to a function that is not the one the caller named, so the extra ulp is a **systematic bias toward zero**, not a rounding error — it has to be carried as a bias term in [[Error Analysis]], and it does not shrink under averaging.

> [!important] The cost is one ulp, not one bit and not one gate
> The scale factor lives entirely in the generation-time constant that fills the ROM. The table has the same $2^{w_X}\times m$ bits, the same address decoding, the same LUT count, and the same critical path as the unscaled one — the $4$-bit example is $2^4\times4=64$ bits either way, four LUTs on an $\alpha=6$ FPGA either way. Every alternative fix spends something the synthesizer can see; this one spends something only the error budget can see.

**Hand it to the generator as a Sollya constant.** In [[FloPoCo]], with 8 bits in and 8 bits out, the whole fix is a change to the function string:

```text
flopoco FixFunctionByTable f="255/256*sin(pi/2*x)" signedIn=false lsbIn=-8 lsbOut=-8
```

The factor is writable in Sollya as `(1b8-1)/1b8`, where `b` means "times two to the power", so it generalises to any $\ell$ without a decimal literal. The resulting VHDL maps `00000000` to `00000000` and `11111111` to `11111111` (p. 490) — the two endpoints of the input format land on the two endpoints of the output format, which is the visible signature of a correctly scaled table.

**Generalise to an affine remap.** Nothing forces the transformation to be a pure scaling: an offset is equally free in a table, so the general form is $g=\alpha f+\beta$ with $\alpha,\beta$ chosen at generation time so that $[\min_X g,\ \max_X g]$ lands strictly inside the format. The book notes the offset explicitly, and notes a variant that scales or *shifts the input* instead — inapplicable to the sine, where the trouble is on the output side, but the right move whenever the input format is what overflows. The scaling error then becomes $|\alpha-1|\cdot|f|+|\beta|$ and must be recomputed; only the $\alpha=1-u$, $\beta=0$ case gives the clean $1$ ulp.

**Read the fix off the 4-bit table.** Entries are $\mathrm{RN}(16\,g(X))$ in units of $u=\tfrac1{16}$, alongside the naive fill for contrast:

| $X$ | $16f(X)$ | naive $\mathrm{RN}$ | stored | $16\cdot\tfrac{15}{16}f(X)$ | scaled $\mathrm{RN}$ | stored |
| --- | --- | --- | --- | --- | --- | --- |
| `0000` | 0.000 | 0 | `0000` | 0.000 | 0 | `0000` |
| `0001` | 1.568 | 2 | `0010` | 1.470 | 1 | `0001` |
| `0010` | 3.121 | 3 | `0011` | 2.926 | 3 | `0011` |
| `0011` | 4.645 | 5 | `0101` | 4.354 | 4 | `0100` |
| `0100` | 6.123 | 6 | `0110` | 5.740 | 6 | `0110` |
| `0101` | 7.542 | 8 | `1000` | 7.071 | 7 | `0111` |
| `0110` | 8.889 | 9 | `1001` | 8.334 | 8 | `1000` |
| `0111` | 10.150 | 10 | `1010` | 9.516 | 10 | `1010` |
| `1000` | 11.314 | 11 | `1011` | 10.607 | 11 | `1011` |
| `1001` | 12.368 | 12 | `1100` | 11.595 | 12 | `1100` |
| `1010` | 13.304 | 13 | `1101` | 12.472 | 12 | `1100` |
| `1011` | 14.111 | 14 | `1110` | 13.229 | 13 | `1101` |
| `1100` | 14.782 | 15 | `1111` | 13.858 | 14 | `1110` |
| `1101` | 15.311 | 15 | `1111` | 14.354 | 14 | `1110` |
| `1110` | 15.693 | **16** | `1_0000`→`0000` | 14.712 | 15 | `1111` |
| `1111` | 15.923 | **16** | `1_0000`→`0000` | 14.928 | 15 | `1111` |

The naive column is wrong by $15.693$ and $15.923$ ulp at the last two addresses — nearly the full dynamic range. The scaled column is wrong by at most $1.5$ ulp everywhere. It is also non-decreasing: $\mathrm{RN}$ of a monotonic function is monotonic, and scaling by a positive constant preserves monotonicity, so that property survives the fix for free (see [[Rounding]]).

$$\boxed{\;\widetilde f(X)=\mathrm{RN}\!\big((1-2^{\ell})f(X)\big),\qquad \big|\widetilde f(X)-f(X)\big|\;\le\;\tfrac12 u+2^{\ell}\lvert f(X)\rvert\;\le\;\tfrac32\,u\;}$$

**Know where the fix stops being the right answer.**

- **The spec is stated against $f$ at faithful accuracy or better.** $1.5\,u > 1\,u$, so a scaled table is not a faithful implementation of $f$ and certainly not a correctly rounded one. It is legal only when the caller can absorb the extra ulp, or when the modified function *is* the contract. Recovering faithfulness means widening $\ell_{\text{out}}$ by one or two bits and paying the ROM cost the fix was meant to avoid.
- **The "$1$ ulp" figure is really $2^{\ell}\max\lvert f\rvert$.** It collapses to one ulp only because a $\mathrm{ufix}(-1,\ell)$ output bounds $|f|$ by $1$. With $m_{\text{out}}\ge0$ the scaling error is up to $2^{\,m_{\text{out}}+1}$ ulp — for a $\mathrm{ufix}(3,\ell)$ output, 16 ulp, which is no longer a rounding-scale perturbation.
- **The error is largest exactly where $f$ is largest**, since it is proportional to $f$. That is the top of the range, which is usually the interesting end and is precisely where the original bug lived. Zeros of $f$, by contrast, stay exact.
- **Exact endpoint identities die.** $\widetilde f$ never returns $1$, so anything downstream that reconstructs a full-range value from the table — quadrant reconstruction for sine, a normalisation, an inverse lookup — sees a systematically small result and must be told about $s$.
- **Signed outputs only need the pull at one end.** In $\mathrm{sfix}$, $-2^{\,m_{\text{out}}+1}$ *is* representable while $+2^{\,m_{\text{out}}+1}$ is not, so scaling shrinks a bound that was never violated on the negative side. Harmless, but it means an asymmetric affine remap is strictly tighter than a symmetric scaling.
- **When the overshoot is one isolated input, widening can be cheaper.** [[Tabulated Reciprocal]] hits $f(0)=1$ exactly at a single address; there the surrounding range-reduction logic already consumes the extra MSB, so paying a bit costs nothing and paying a ulp would cost accuracy for all $2^{w_X}$ entries.
- **Do not verify by reasoning about the continuous range.** The whole failure class comes from $\max_X \mathrm{RN}(f(X))$ exceeding $\sup f$; the fix must be checked by enumerating the discrete image, which at $w_X\le24$ is always feasible.

**Put both fills in one entity so the difference is simulable.**

```spade
/// 4-bit ufix(-1,-4) table for sin(pi/2 x) on [0,1), filled two ways.
/// High nibble: naive RN(16 f(X)). At X = 14/16 and 15/16 that value is 16,
///              i.e. 1_0000, which the 4-bit output format wraps to 0000.
/// Low  nibble: RN(16 * (1 - 2^-4) * f(X)) -- output range scaling.
entity sin_table4(x: uint<4>) -> uint<8> {
    let naive: uint<4> = match x {
        0  => 0,  1  => 2,  2  => 3,  3  => 5,
        4  => 6,  5  => 8,  6  => 9,  7  => 10,
        8  => 11, 9  => 12, 10 => 13, 11 => 14,
        12 => 15, 13 => 15,
        _  => 0,
    };
    let scaled: uint<4> = match x {
        0  => 0,  1  => 1,  2  => 3,  3  => 4,
        4  => 6,  5  => 7,  6  => 8,  7  => 10,
        8  => 11, 9  => 12, 10 => 12, 11 => 13,
        12 => 14, 13 => 14,
        _  => 15,
    };
    naive.concat(scaled)
}
```

`x` is the 4-bit address on the horizontal axis of the diagram; `scaled` is the blue dot column, `naive` is the same table without the fix, and `concat` packs the naive nibble high — for integers `a.concat(b)` puts `a` in the most significant position, the opposite of the array convention. The entity is purely combinational: both `match`es are address decoding, and synthesis will not build two ROMs but a single 8-output Boolean function over 4 inputs, sharing whatever minterms the two columns have in common — the $2^{w_X}\times m$ bit count is a conceptual size, not a gate count. The `_ => 0` arm is the wrap, written out rather than commented, so that simulation can catch it.

Simulated with `.zettel/sim.sh`: **3037 vectors pass** — all 16 addresses exhaustively against a real-valued reference `$rtoi(15.0*$sin(pi/2*i/16)+0.5)` computed independently in the testbench, plus a 3000-vector random sweep against the same reference, plus explicit asymmetric corner checks at the two top addresses `x=14` and `x=15` where the two columns disagree (`naive=0`, `scaled=15`) and at `x=0` where they must agree. The testbench also asserts the two properties the scaling is bought for: no nonzero address produces `0`, and the scaled column is non-decreasing.

**Related notes.**

- [[Function Table ROM]] – depends-on: this changes what goes in the table, not the table itself.
- [[Output Format Widening]] – compares: fix (a) spends an output MSB and leaves half the range unused, but keeps $f$ exact.
- [[Saturating Output Clamp]] – compares: fix (b) touches only the offending addresses, at the cost of a comparator and nearly $1$ ulp there.
- [[Round-Down Table Fill]] – compares: fix (c) changes the rounding operator rather than the function, doubling the budget to $1$ ulp everywhere.
- [[Tabulated Reciprocal]] – counter-example: an image reaching $1$ at exactly one address, where taking the extra MSB is the cheaper answer.
- [[Rounding]] – supports: monotonicity and idempotence of $\mathrm{RN}$, the two facts the correctness proof rests on.
- [[Error Analysis]] – supports: where the extra ulp is carried, as a bias rather than a rounding term.
- [[FloPoCo]] – supports: the generator that accepts the scale factor as part of the Sollya function string.
- [[Multiplication by Constants]] – counter-example: outside a table the same $1-2^{\ell}$ factor is a real operator, though a cheap one — a shift and a subtract.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024:

- §16.2.1 Range Issues and Their Solutions, pp. 481–484 — the wrap failure; the four fixes; Fig. 16.5 (p. 482), Fig. 16.6d (p. 483), Fig. 16.7 (p. 484). The scale factor $1-2^{\ell}$, the possibility of a constant offset, the input-side variant, and the $1.5$ ulp bound are all on p. 483.
- §16.2.2 Monotonicity Issue, p. 485 — rounding to nearest preserves monotonicity.
- §16.4.1 Tabulating Precomputed Function Values in a ROM, p. 490 — the `FixFunctionByTable` invocation, the Sollya `(1b8-1)/1b8` syntax, and the `00000000`→`00000000` / `11111111`→`11111111` check.
- §16.4.2 Actual Cost of a ROM, pp. 491–492 — why the bit count is not the gate count.

> [!warning] Page-offset correction for this chapter
> The authoring brief states PDF page = printed page + 22. In Chapter 16 the offset is **+13**: PDF 496 renders printed 483 (Fig. 16.6), and PDF 503 renders printed 490. All page numbers cited above are printed-book numbers, read at the +13 offset.
