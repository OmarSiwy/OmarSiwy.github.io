---
title: Monotonic Multipartite Tables
description: "Buys monotonicity back from a faithful operator by taking the right-end slope instead of the averaged chord slope — wider tables and more guard bits, 7.25 KB against 5.5 KB in AMD's K6-2 reciprocal square root."
kind: circuit
source: "ASA §17.2.10, pp. 521-522"
status: seed
spade: simulated
tags: [digital, table-based-function-evaluation, multipartite, monotonicity, faithful-rounding, rom]
aliases:
  - Monotonic Bipartite Tables
  - Enforcing Monotonicity in Table Methods
  - Right-End Slope Table Filling
  - Non-Monotonicity of Faithful Tables
---

# Monotonic Multipartite Tables

A multipartite operator whose table of offsets is filled with the slope at the *right* end of each group instead of the minimax-balanced slope, which is the cheapest known way to make a faithful table-and-addition architecture non-decreasing.

```tikz title="Two slope choices on one C-group: the balanced chord average over-slopes most segments and lets the boundary jump go down, while the right-end slope under-slopes every segment so every jump is up"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}
\footnotesize
\foreach \dx/\lab/\ttl in {0/a/{averaged chord slope $s=(\sigma_l+\sigma_r)/2$}, 5.9/b/{right-end slope $s=\sigma_r$}}{
 \begin{scope}[xshift=\dx cm]
  \draw[->] (-0.15,0.45) -- (4.45,0.45) node[anchor=north east,font=\tiny,yshift=-2pt]{$x$};
  \draw[->] (-0.15,0.45) -- (-0.15,4.15);
  \foreach \x in {1,2,3} \draw[gray!55,densely dashed] (\x,0.5) -- (\x,4.0);
  \node[font=\tiny,anchor=south,align=center] at (2.0,4.15) {(\lab)~\ttl};
 \end{scope}}
% ---- exact f, same curve in both panels ----
\foreach \dx in {0,5.9}{
 \begin{scope}[xshift=\dx cm]
  \draw[blue!65,line width=1.3pt] (0.00,0.704) -- (0.25,1.028) -- (0.50,1.307) -- (0.75,1.556)
    -- (1.00,1.783) -- (1.25,1.992) -- (1.50,2.188) -- (1.75,2.373) -- (2.00,2.547)
    -- (2.25,2.714) -- (2.50,2.873) -- (2.75,3.027) -- (3.00,3.174) -- (3.25,3.317)
    -- (3.50,3.455) -- (3.75,3.588) -- (4.00,3.718);
  \node[blue,font=\tiny,anchor=west] at (4.05,3.72) {$f$};
 \end{scope}}
% ---- panel (a): balanced fit, two boundary jumps go down ----
\begin{scope}
  \draw[red!85!black,line width=0.75pt] (0.000,0.838) -- (1.000,1.649);
  \draw[red!85!black,line width=0.75pt] (1.000,1.763) -- (2.000,2.574);
  \draw[red!85!black,line width=0.75pt] (2.000,2.455) -- (3.000,3.267);
  \draw[red!85!black,line width=0.75pt] (3.000,3.041) -- (4.000,3.852);
  \draw[green!45!black,-latex,thick] (1.0,1.649) -- (1.0,1.763);
  \draw[red,-latex,very thick] (2.0,2.574) -- (2.0,2.455);
  \draw[red,-latex,very thick] (3.0,3.267) -- (3.0,3.041);
  \node[red,font=\tiny,anchor=west] at (2.06,2.30) {jump down};
  \node[red,font=\tiny,anchor=west] at (3.06,2.90) {jump down};
  \node[font=\tiny,anchor=north,align=center] at (2.0,-0.10)
    {$\sigma_1>s$ on the first segment, $\sigma_i<s$ on the rest:\\[-2pt]
     the fit over-slopes and the next TIV starts it lower};
\end{scope}
% ---- panel (b): right-end fit, every jump up ----
\begin{scope}[xshift=5.9cm]
  \draw[green!40!black,line width=0.75pt] (0.000,0.971) -- (1.000,1.516);
  \draw[green!40!black,line width=0.75pt] (1.000,1.893) -- (2.000,2.437);
  \draw[green!40!black,line width=0.75pt] (2.000,2.589) -- (3.000,3.133);
  \draw[green!40!black,line width=0.75pt] (3.000,3.178) -- (4.000,3.723);
  \foreach \x/\ya/\yb in {1/1.516/1.893, 2/2.437/2.589, 3/3.133/3.178}
    \draw[green!45!black,-latex,very thick] (\x,\ya) -- (\x,\yb);
  \node[green!45!black,font=\tiny,anchor=west] at (1.06,1.55) {up};
  \node[green!45!black,font=\tiny,anchor=west] at (2.06,2.48) {up};
  \node[green!45!black,font=\tiny,anchor=west] at (3.06,3.13) {up};
  \node[font=\tiny,anchor=north,align=center] at (2.0,-0.10)
    {$s=\sigma_r\le\sigma_i$ for every segment: the fit\\[-2pt]
     under-slopes everywhere, so no jump can be negative};
\end{scope}
% ---- shared footer ----
\node[font=\tiny,anchor=north,align=center] at (4.95,-1.30)
  {four segments of one $C$-group, $\Delta=2^{\ell_X}(2^{\beta}-1)$ wide; each segment's intercept comes from its own $\mathrm{TIV}(A)$, the slope from $\mathrm{TO}(C,B)$\\[-2pt]
   the residual is centred either way, so (b) costs exactly $2\times$ the approximation error of (a) --- and one more guard bit};
\end{circuitikz}
\end{document}
```

**Name the defect before fixing it.** Faithful rounding asks only for $|R-f|<2^{\ell_R}$, which leaves two legal codes at almost every input, so a monotonic $f$ may legally be implemented by a non-monotonic $R$ — see [[Fixed-Point Function Approximation]] for the definition and [[Rounding]] for the ulp. Every faithful scheme is exposed to this, but [[Multipartite Methods]] triggers it far more often than most, because the fitting error is *deliberately* balanced to $\pm\delta_i$ and the extremes of that balance land exactly at the segment endpoints. The excursion is never more than one ulp, and it is invisible to the accuracy specification: the operator is correct, it just fails a property nobody wrote down.

**Reduce monotonicity to one inequality per boundary.** Inside a segment $A$ the implemented value is $\mathrm{TIV}(A)+\mathrm{TO}(C,B)$ with $B$ running over $0\dots2^{\beta}-1$ and $\mathrm{TO}$ linear and increasing in $B$, so $S(X)$ is non-decreasing for the $2^{\beta}$ codes inside a segment by construction. **All the risk is concentrated at the $2^{\alpha}-1$ segment boundaries**, where the last code of segment $A$ is followed by the first code of segment $A+1$ and the TIV changes:

$$J_A \;=\; \bigl[\mathrm{TIV}(A{+}1)+\mathrm{TO}(C',0)\bigr]-\bigl[\mathrm{TIV}(A)+\mathrm{TO}(C,2^{\beta}-1)\bigr]$$

Monotonicity of the pre-rounding sum is exactly $J_A\ge0$ for every $A$, and since the final rounding to $\ell_R$ is itself a non-decreasing map, $S$ non-decreasing $\Rightarrow$ $R$ non-decreasing. That is the whole problem: $2^{\alpha}-1$ scalar inequalities.

**Read $J_A$ off the sign of the fit error.** Write the real-valued fit on segment $A$ as $L_A(x)=c_A+s(x-x_{A,0})$ and its residual $r_A=f-L_A$. The minimax choice of the intercept $c_A$ centres that residual, $\max r_A=-\min r_A=e_A$, whatever $s$ is — which is why *magnitude* of error tells you nothing here. What decides $J_A$ is *where* on the segment the extremes sit. If $s\le f'(x)$ throughout the group, then $f(x)-sx$ is non-decreasing by monotonicity of the integral of a non-negative derivative, so $r_A$ is non-decreasing too: it hits $-e_A$ at the first code and $+e_A$ at the last. Then $L_A(x_{A,\text{last}})=f(x_{A,\text{last}})-e_A$ while $L_{A+1}(x_{A+1,0})=f(x_{A+1,0})+e_{A+1}$, and

$$J_A=\underbrace{f(x_{A+1,0})-f(x_{A,\text{last}})}_{>0\ \text{since}\ f\ \uparrow}+\;e_{A}+e_{A+1}\;>\;0$$

with every term positive. The over-sloping case is the mirror image: $s\ge f'$ makes $r_A$ decreasing, both $e$ terms flip sign, and $J_A$ can and does go negative.

> [!important] Monotonicity is a property of the **sign** of the approximation error, not of its size. Shrinking $\overline{\delta_{\text{approx}}}$ — a bigger $\alpha$, a bigger $\gamma$, more guard bits — does not fix a backward step; it only makes it rarer. Only forcing the error to keep one sign across each segment removes it.

**Pick the slope that satisfies the inequality.** For a monotonically increasing $f$ with decreasing derivative — the shape [[Multipartite Methods]] already assumes, since range reduction is applied first — $f'$ is smallest at the right end of the $C$-group, so $s_i(C_i)\le f'(x_{rr})$ is the exact condition and taking the *right-end* slope is the cheapest way to meet it. The discrete version is free: the balanced-slope derivation already computes the two extreme chord slopes $\sigma_l$ and $\sigma_r$, and

$$s_i(C_i)=\frac{\sigma_l+\sigma_r}{2}\quad\longrightarrow\quad s_i(C_i)=\sigma_r=\frac{f(x_{rr})-f(x_{rl})}{\Delta_i}$$

is a one-line change to the table generator. By the mean value theorem $\sigma_r=f'(\xi)$ for some $\xi$ inside the rightmost segment, so $\sigma_r$ is marginally larger than $f'(x_{rr})$ and the strict condition fails on that one segment; in practice both work and $\sigma_r$ is the smaller error. The exhaustive $2^{w_X}$ evaluation that a multipartite generator runs anyway is what settles it.

**Price the change in $\delta_{\text{approx}}$, and it is exactly a factor two.** The residual on a segment of chord slope $\sigma$ with a fixed slope $s$ and a free intercept is $\pm(\sigma-s)\Delta_i/2$. The balanced choice equalises the two extreme segments, giving $\overline{\delta_i}=(\sigma_r-\sigma_l)\Delta_i/4$; the right-end choice makes the leftmost segment the worst, giving $(\sigma_l-\sigma_r)\Delta_i/2$. The ratio is $2$ identically — no function, no decomposition, no width enters it. Feeding that into the guard-bit budget of [[Multipartite Methods]],

$$g=\left\lceil \ell_R-1+\log_2 m-\log_2\!\left(2^{\ell_R-1}-\overline{\delta_{\text{approx}}}\right)\right\rceil$$

a doubled $\overline{\delta_{\text{approx}}}$ shrinks the bracket, so $g$ grows — typically by one — and **every one of the $m+1$ tables gets one bit wider**, plus one more bit on the final adder. Worse, the rejection test $\overline{\delta_{\text{approx}}}<2^{\ell_R-1}$ now bites at half the old margin, so decompositions that were legal become illegal and the search is pushed towards a larger $\alpha$ or $\gamma_i$: the TIV, already the dominant cost, gets both wider and taller.

**Measure it on a real instance.** Take $f(x)=\sqrt{1+x}-1$ on $[0,1)$ — increasing, concave, the shape [[Square Root]] gets after range reduction — with $w_X=8$, $\ell_X=\ell_R=-8$, $w_R=7$, bipartite ($m=1$), $\alpha=5$, $\beta=3$, $\gamma=1$, symmetry not exploited. Both fills were generated and evaluated over all $256$ inputs:

| fill | $\overline{\delta_{\text{approx}}}$ | $g$ | TIV | TO | total | max $\lvert R-f\rvert$ | backward steps |
| --- | --- | --- | --- | --- | --- | --- | --- |
| balanced $(\sigma_l+\sigma_r)/2$ | 0.1504 ulp | 1 | $32\times8$ | $16\times3$ | 304 b | 0.953 ulp | **1**, at $X=232$ |
| right-end $\sigma_r$ | 0.3009 ulp | 2 | $32\times9$ | $16\times4$ | 352 b | 0.797 ulp | 0 |

The single defect sits at $X=232=29\cdot2^{\beta}$ — a segment boundary, as predicted — where $R$ falls from $98$ to $97$ while $f$ rises through $97.45\cdot2^{-8}$. Note that the monotonic version is also the *more accurate* one at 0.797 ulp: the extra guard bit bought back more in rounding error than the slope lost in approximation error. Accuracy is not what you pay with. Area is: $+15.8\%$ of table bits for this instance, against the $+31.8\%$ Iordache and Matula measured on silicon.

**Cost it in FPGA fabric rather than bits.** Under the $\lambda$-input LUT model of [[Table-Based Function Evaluation|the cost section]], a $2^k\times n$ table costs $2^{\max(k-\lambda,0)}\times n$ LUTs, so on a $\lambda=6$ device the TIV ($k=5$) goes from 8 to 9 LUTs and the TO ($k=4$) from 3 to 4: **the extra guard bit is paid in full, one LUT per output bit, and none of the address bits are paid at all** because both tables sit below $2^{\lambda}$ entries. Total 11 to 13 LUTs, $+18\%$ — worse than the bit count suggests, because the wasted half of each LUT does not shrink. On an ASIC the standard-cell model $A\propto2^{0.65\min(k,n)}2^{0.19|k-n|}$ is symmetric in $k$ and $n$, so a guard bit on the output costs roughly what an address bit would; and above the block-RAM crossover the whole question dissolves, since a plain ROM is correctly rounded and therefore monotonic for free.

**Distinguish the general recipe from what AMD actually shipped.** Iordache and Matula reverse-engineered the K6-2 3DNow! reciprocal and reciprocal-square-root instructions and found bipartite tables inside: the reciprocal came out monotonic, the reciprocal square root did not. Their fix was *not* the slope rule — they increased the **output width of the TIV** and then searched exhaustively for what those extra bits should hold, landing at 7.25 KB against 5.5 KB. That is the same lever pulled from the other end: more guard bits, chosen by search rather than by construction, on the one table that dominates the area.

> [!warning] The book states the slope rule without proof or measurement
> §17.2.10 (p. 522) says monotonicity "can be enforced simply … by using appropriate slopes and TIV" and closes with "a general and systematic study of this question remains to be done." No bound on the resulting $\overline{\delta_{\text{approx}}}$, no cost table, and no treatment of $m>1$ is given. The factor-two result and the boundary-jump argument above are derived here from the chapter's own error analysis (§17.2.5, pp. 511-516) and confirmed on the instance tabulated above; the multi-TO case, where the $m$ slopes interact, is genuinely open.

$$\boxed{\;s_i(C_i)=\sigma_r\;\le\;f'(x_{rr})\;\Longrightarrow\;J_A>0\ \forall A\;\Longrightarrow\;R\ \text{non-decreasing},\qquad \overline{\delta_i}=\frac{(\sigma_l-\sigma_r)\Delta_i}{2}=2\,\overline{\delta_i^{\text{bal}}}\;}$$

**When it breaks.**

- **$f$ must be monotonic with monotonic derivative on the whole reduced interval.** An inflection point splits the argument: the group straddling it needs $s\le\min f'$ over the group, which is neither $\sigma_l$ nor $\sigma_r$. Range-reduce first.
- **Decreasing $f$ flips the recipe** — take the *left*-end slope, since it is now the slope of smallest magnitude and the same sign argument runs with $J_A<0$ throughout.
- **$m>1$ is not covered.** With several TOs each carrying its own $s_i$, the boundary jump is a sum of $m$ per-table jumps at $m$ different boundary granularities; making each one individually non-negative is sufficient but almost certainly not tight.
- **It is a sufficient condition, not a characterisation.** Balanced slopes are monotonic most of the time — the K6-2 reciprocal was — so applying this by reflex costs a guard bit for nothing. Run the exhaustive check on the cheap version first; only fall back here if it fails.
- **Above the block-RAM crossover, stop.** A plain ROM is correctly rounded and hence monotonic at zero extra cost, which beats any of this; see [[Choosing a Table Method]].
- **Correct rounding is not implied.** The operator remains faithful, so it still differs from the correctly rounded result at some inputs. If you need both, go to [[ILP-Optimized Multipartite Tables]].

**RTL (Spade).**

```spade
/// Bipartite table for f(x) = sqrt(1+x) - 1 on [0,1), w_X = 8, l_X = l_R = -8.
/// alpha = 5, beta = 3, gamma = 1, m = 1, g = 2. Tables filled with the
/// right-end slope sigma_r of each C-group, so R is non-decreasing.
fn tiv_m(a: uint<5>) -> uint<9> {
    let t: [uint<9>; 32] = [
        1, 17, 32, 48, 63, 78, 92, 107, 121, 135, 149, 163, 177, 190, 204, 217,
        230, 243, 256, 268, 281, 293, 306, 318, 330, 342, 354, 366, 377, 389, 400, 412];
    t[a]
}

fn to_m(cb: uint<4>) -> uint<4> {
    let t: [uint<4>; 16] = [0, 2, 4, 5, 7, 8, 10, 12, 1, 2, 4, 5, 7, 8, 10, 11];
    t[cb]
}

entity mono_bip8(x: uint<8>) -> uint<7> {
    let bits = x.as_bits();
    let a: uint<5>  = bits[3..8].as_uint();
    let c: uint<1>  = bits[7..8].as_uint();
    let b: uint<3>  = bits[0..3].as_uint();
    let s: uint<11> = zext::<9,10>(tiv_m(a)) + zext::<4,10>(to_m(c.concat(b)));
    trunc((s + 2) >> 2)
}
```

`tiv_m` is the tall left block of the multipartite datapath and `to_m` the short right one; `c.concat(b)` is the $\gamma+\beta=4$-bit TO address, with $C$ high because integer `concat` puts its left operand in the high half (the array convention is the opposite — element 0 is the LSB — and getting that backwards yields a table that compiles and reads the wrong entry). All arithmetic is in units of $2^{\ell_R-g}=2^{-10}$: the TIV is 9 bits and the TO 4, both one wider than the balanced fill would need, and `(s + 2) >> 2` is the final round-to-nearest from $\ell_R-g$ back to $\ell_R$, the `+ 2` being $2^{g-1}$. Everything is combinational — a `fn` for each table, one `entity` for the datapath, no clock — and synthesis will not build the two array multiplexers the source implies: with 32 and 16 entries both tables collapse into LUT contents, 9 and 4 LUTs on a $\lambda=6$ device.

Compiled first try, then simulated with the balanced-slope fill of the *same* decomposition instantiated alongside as a control: all 256 inputs exhaustively, checking $\lfloor 2^{8}f\rfloor\le R\le\lceil 2^{8}f\rceil$ for faithfulness and $R_i\ge R_{i-1}$ for monotonicity, plus the named asymmetric vectors $X=1$, $X=232$ and $X=255$ and a 3000-vector random sweep against the behavioural reference. Result: both fills faithful, the right-end fill with **0** backward steps and the balanced fill with exactly **1**, the testbench asserting that count so that a table regenerated with the wrong slope fails rather than silently passes.

**Related Notes.**

- [[Multipartite Methods]] – depends-on: supplies the decomposition $\mathcal{D}$, the balanced slope this note replaces, and the guard-bit budget it inflates.
- [[Bipartite Table Method]] – depends-on: the $m=1$ case, which is what AMD shipped and what the instance above measures.
- [[Fixed-Point Function Approximation]] – depends-on: faithful rounding leaves two legal codes per input, which is the entire opening for non-monotonicity.
- [[Symmetric Table of Offsets]] – compares: the half-segment symmetry survives the slope change untouched, since $\mathrm{TO}$ is still odd in $B$ about the segment centre — only the stored values change, not the XOR structure.
- [[Division by Reciprocal]] – supports: the K6-2 reciprocal was monotonic with the ordinary fill, which is why this note is a fallback and not a default.
- [[Square Root]] – counter-example: the reciprocal square root on the same silicon was the one that needed 7.25 KB instead of 5.5 KB.
- [[ILP-Optimized Multipartite Tables]] – extends: below 16 bits an ILP gets correct rounding, and correct rounding is monotonic by construction, so the whole question disappears.
- [[Choosing a Table Method]] – compares: monotonicity as a selection criterion, where a plain ROM wins outright by getting it free.
- [[HUB Table Filling]] – supports: the guard-bit accounting the extra bit is added to, and the reason table opposites are bitwise complements.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024, Chapter 17.

- §17.2.10 "The Issue of Non-Monotonicities", pp. 521-522 — the defect, the K6-2 result of Iordache and Matula [IM99], the right-end-slope recipe, and Fig. 17.15
- §17.2.5 "Error analysis", pp. 511-516 — the balanced slope $s_i=(\sigma_l+\sigma_r)/2$, the residual $\pm(\sigma-s)\Delta_i/2$, and the guard-bit formula reused above
- §17.2.6 "Computing the sizes of the sub-tables", pp. 516-517 — the TIV and $\mathrm{TO}_i$ bit counts the cost table is built from
- §16.4.2 "Actual Cost of a ROM", Eq. (16.1), pp. 491-492 — the LUT and standard-cell cost models used for the FPGA/ASIC comparison

Long-form source: [[4.2) Table-Based Function Evaluation]], §"The non-monotonicity issue".
