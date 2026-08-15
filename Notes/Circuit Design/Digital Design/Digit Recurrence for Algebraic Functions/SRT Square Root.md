---
title: SRT Square Root
description: "Redundant digit set plus a carry-save residual cuts the per-iteration carry propagation to a few leading digits, at the cost of an on-the-fly converter and a two-dimensional selection function."
kind: circuit
source: "ASA §19.1.5, pp. 580-588"
status: seed
spade: simulated
tags: [digital, digit-recurrence-for-algebraic-functions, square-root, srt, redundant, carry-save]
aliases:
  - Redundant Digit-Recurrence Square Root
  - Radix-4 SRT Square Root
  - SRT Sqrt
---

# SRT Square Root

A digit-recurrence square root whose digits come from a redundant set $\{-\gamma,\dots,\gamma\}$ and whose residual stays in carry-save, so the carry propagation inside an iteration is confined to the handful of leading digits the selection function reads rather than the whole word.

```tikz title="P-D selection diagram for radix-4 square root with gamma=2 at iteration 1: five overlapping digit regions in the (S_1, beta W_1) plane"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % x: S_1 in [1,2] mapped to [0,8] cm.  y: beta*W_1 at 0.4 cm per unit.
  \begin{scope}
    \clip (0,-4.6) rectangle (8,4.6);
    % validity band of each digit: 2(d-rho)S + b^-2(d-rho)^2  ..  2(d+rho)S + b^-2(d+rho)^2
    \fill[black!10] (0, 1.111) -- (8, 2.178) -- (8, 4.444) -- (0, 2.311) -- cycle;
    \fill[black!10] (0, 0.269) -- (8, 0.536) -- (8, 2.736) -- (0, 1.403) -- cycle;
    \fill[black!10] (0,-0.522) -- (8,-1.056) -- (8, 1.078) -- (0, 0.544) -- cycle;
    \fill[black!10] (0,-1.264) -- (8,-2.597) -- (8,-0.531) -- (0,-0.264) -- cycle;
    \fill[black!10] (0,-1.956) -- (8,-4.089) -- (8,-2.089) -- (0,-1.022) -- cycle;
    % the overlaps: two digits legal at once
    \fill[black!32] (0, 1.111) -- (8, 2.178) -- (8, 2.736) -- (0, 1.403) -- cycle;
    \fill[black!32] (0, 0.269) -- (8, 0.536) -- (8, 1.078) -- (0, 0.544) -- cycle;
    \fill[black!32] (0,-0.522) -- (8,-1.056) -- (8,-0.531) -- (0,-0.264) -- cycle;
    \fill[black!32] (0,-1.264) -- (8,-2.597) -- (8,-2.089) -- (0,-1.022) -- cycle;
    % boundary lines
    \draw[gray]  (0, 1.111) -- (8, 2.178);   \draw[gray]  (0, 2.311) -- (8, 4.444);
    \draw[thick] (0, 0.269) -- (8, 0.536);   \draw[gray]  (0, 1.403) -- (8, 2.736);
    \draw[gray]  (0,-0.522) -- (8,-1.056);   \draw[thick] (0, 0.544) -- (8, 1.078);
    \draw[gray]  (0,-1.264) -- (8,-2.597);   \draw[gray]  (0,-0.264) -- (8,-0.531);
    \draw[gray]  (0,-1.956) -- (8,-4.089);   \draw[gray]  (0,-1.022) -- (8,-2.089);
    \draw[dashed,gray] (0,0) -- (8,0);
    % the five reachable S_1 values
    \foreach \x in {0,2,4,6,8} { \draw[black!45,densely dotted] (\x,-4.6) -- (\x,4.6); }
    % digit labels, one per region
    \node[fill=white,inner sep=1pt] at (4, 2.51) {$d_{-2}=2$};
    \node[fill=white,inner sep=1pt] at (4, 1.24) {$d_{-2}=1$};
    \node[fill=white,inner sep=1pt] at (4, 0.01) {$d_{-2}=0$};
    \node[fill=white,inner sep=1pt] at (4,-1.16) {$d_{-2}=-1$};
    \node[fill=white,inner sep=1pt] at (4,-2.29) {$d_{-2}=-2$};
  \end{scope}
  \draw (0,-4.6) rectangle (8,4.6);
  % x axis: the five reachable values of S_1
  \foreach \x/\lab in {0/{01.00}, 2/{01.01}, 4/{01.10}, 6/{01.11}, 8/{10.00}} {
    \draw (\x,-4.6) -- (\x,-4.82); \node[below,font=\footnotesize\ttfamily] at (\x,-4.82) {\lab};}
  \node[below] at (4,-5.5) {$S_1$ --- \texttt{ufix(1,-2)}, 4 bits; only these five values are reachable};
  % y axis
  \foreach \y/\lab in {-4/-10, -2/-5, 0/0, 2/5, 4/10} {
    \draw (0,\y) -- (-0.22,\y); \node[left,font=\footnotesize] at (-0.22,\y) {\lab};}
  \node[rotate=90] at (-1.35,0) {$\beta W_1$ --- selection reads its 5 leading bits};
  % annotations
  \node[anchor=north west,align=left,text width=5.8cm] at (8.7,4.4)
    {Each boundary is a line in $S_i$ of slope $2(d\pm\rho)$. $S_i$ is the result \emph{being built}, so the whole fan is redrawn every iteration --- division's boundaries are fixed lines in the constant divisor $D$.};
  \node[anchor=north west,align=left,text width=5.8cm] at (8.7,1.4)
    {Dark stripes: two digits are legal at once. That overlap is what the redundant digit set buys --- it is wide enough to decide from 5 leading bits of a carry-save residual plus 4 bits of $S_1$.};
  \node[anchor=north west,align=left,text width=5.8cm] at (8.7,-1.5)
    {Intercepts $\beta^{-i-1}(d\pm\rho)^2$ push every line off the origin (visibly asymmetric here); they decay like $\beta^{-i}$, so one selection function serves all $i\ge i_0=3$.};
  \node[anchor=north west,align=left,text width=5.8cm] at (8.7,-3.7)
    {The outermost pair is the invariant $-2\rho S_i+\rho^2\beta^{-i}\le W_i\le 2\rho S_i+\rho^2\beta^{-i}$ itself.};
  \draw[->] (8.6,0.45) -- (7.15,0.70);
\end{circuitikz}
\end{document}
```

*after Fig. 19.5, p. 583.*

**Name the bottleneck this circuit exists to remove.** The generic radix-$\beta$ recurrence maintains the scaled remainder $W_i = \beta^i(M - S_i^2)$ for a significand $M\in[1,4)$ in $\mathrm{ufix}(2,\ell)$ and a partial root $S_i$ in $\mathrm{ufix}(1,-\alpha i)$ — writing $\alpha = \log_2\beta$, that is $\alpha i + 2$ bits after $i$ iterations — and advances it by

$$W_{i+1} = \beta W_i - 2\,d_{-i-1}S_i - \beta^{-i-1}d_{-i-1}^2$$

Every quantity on the right is known, so the step is one subtraction — but the subtrahend spans positions $-\alpha i - \alpha$ up to $2$, and that width *grows with $i$*. In the plain non-restoring form ([[Non-Restoring Square Root]]) iteration $i$ costs a carry-propagate add of $i+4$ bits, so the iteration delay is not constant: the last iterations are the slow ones and they set the clock period.

**The obvious fix is illegal, and the reason is the whole design.** Keep $W_i$ in carry-save — two words $(w^s, w^c)$ with $W_i = w^s + w^c$, summed by a 3:2 row ([[CSA, Carry-Save Adder]]) whose delay is one full-adder regardless of width. This fails immediately, because you cannot read the **sign** of a carry-save number without assimilating it, and the sign is exactly what a non-redundant digit selection consumes. Carry-save moves the carry propagation out of the adder and straight into the decision.

**Buy the decision back by making the digits redundant.** Take $d_{-j}\in\{-\gamma,\dots,\gamma\}$ with $\gamma \ge \lceil\beta/2\rceil$, so consecutive digits' intervals overlap and several digits are legal at each step ([[Redundant Number Systems]]). Formally, replace the exact bound on $W_i$ with a bound on the absolute error $\delta_i = S_i - \sqrt M$, and look for the invariant $|\delta_i| \le \rho\beta^{-i}$. Imposing it on $\delta_{i+1} = \delta_i + \beta^{-i-1}d_{-i-1}$ needs $|\delta_i + \beta^{-i-1}d_{-i-1}| \le \rho\beta^{-i-1}$; the worst positive error $\delta_i = \rho\beta^{-i}$ must be correctable by the most negative digit $-\gamma$, giving $\rho\beta^{-i} - \gamma\beta^{-i-1} \le \rho\beta^{-i-1}$, i.e. $\rho \le \gamma/(\beta-1)$ after multiplying through by $\beta^{i+1}$. The worst negative case is symmetric. Take the largest admissible value — more freedom is always better — and you recover **the same redundancy factor as division**, $\rho = \gamma/(\beta-1)$: a property of the number system alone, not of the function. Radix 4 with $\gamma = 2$ gives $\rho = 2/3$.

**Convert the error bound into a residual bound by squaring.** From $-\rho\beta^{-i} \le S_i - \sqrt M \le \rho\beta^{-i}$, rewrite as $S_i - \rho\beta^{-i} \le \sqrt M \le S_i + \rho\beta^{-i}$. All three members are positive (the square root of a normalised significand is at least 1 and $\rho \le 1$), so squaring preserves the order and gives $S_i^2 - 2\rho\beta^{-i}S_i + \rho^2\beta^{-2i} \le M \le S_i^2 + 2\rho\beta^{-i}S_i + \rho^2\beta^{-2i}$. Subtract $S_i^2$ and multiply by $\beta^i$; the middle member becomes $\beta^i(M - S_i^2) = W_i$ by definition:

$$-2\rho S_i + \rho^2\beta^{-i} \;\le\; W_i \;\le\; 2\rho S_i + \rho^2\beta^{-i}$$

**Push that invariant one step forward to get a selection rule.** Impose the same bound on $W_{i+1}$, substitute the recurrence for $W_{i+1}$ and $S_{i+1} = S_i + \beta^{-i-1}d_{-i-1}$ on the right, and collect the $S_i$ terms. Writing $d$ for $d_{-i-1}$, the pair collapses to the two constraints boxed below. They say: given the residual and the partial root you already have, $d$ is legal iff the point $(S_i, \beta W_i)$ lies inside the band belonging to $d$.

**Read the geometry off the P-D diagram.** Each constraint is a straight line in $S_i$ of slope $2(d\pm\rho)$ with intercept $\beta^{-i-1}(d\pm\rho)^2$, so the plane $(S_i,\beta W_i)$ splits into $2\gamma+1$ overlapping wedges. Two features distinguish this from division's P-D diagram. First, the $x$-axis is $S_i$, **the result being built**, so the fan is redrawn at every iteration; division's axis is the constant divisor and its diagram is drawn once. Second, the intercepts are nonzero, so the boundaries do not pass through the origin — but they decay like $\beta^{-i}$, which is why a single selection function can be shared for all $i \ge i_0$ once $i_0$ is large enough. Ercegovac and Lang's analysis for $\beta=4,\gamma=2$ finds $i_0 = 3$ works, with $t_W = t_S = -4$: **4 truncated bits of $W_i$ and 4 leading fractional bits of $S_i$** ([[Square Root Digit Selection Function]] carries that construction and the one-sided truncation error). The first iterations are the awkward ones: at $i=0$ only $S_0\in\{1,2\}$ is reachable (Fig. 19.4), at $i=1$ only the five values `01.00 01.01 01.10 01.11 10.00` drawn above, and selection there takes 4 bits of $S_1$ against 5 bits of $W_1$; $S_2$ is already 6 bits wide.

> [!important] Why the square root's selection is two-dimensional and division's is not
> Division's recurrence is $W_{i+1} = \beta W_i - d_{-i-1}D$: the multiplicand $D$ is a **constant**, fixed before iteration 0, so its selection function is one-dimensional in $\widetilde{W_i}$ once $D$'s leading bits are known. Here the cross term is $2d_{-i-1}S_i$ and the multiplicand is $S_i$ — *the very thing the digits being selected are constructing*. The selection function must therefore take $S_i$ as a second input, which is what makes it a $2^{t_W+t_S}$-entry table instead of a $2^{t_W}$-entry one, and what forces $S_i$ into standard binary before it can be truncated. Everything expensive about SRT square root over [[SRT Division]] follows from that one substitution.

**Initialisation stops being free.** With a non-redundant digit set the leading digit is forced, $d_0 = 1$, because $M\in[1,4)\Rightarrow\sqrt M\in[1,2)$. Redundancy breaks that: starting from $S_0 = 1$ with $M\in[2,4)$ gives $W_0 = M - 1 \in [1,3)$, which exceeds the upper bound $2\rho S_0 + \rho^2\beta^0 = 4/3 + 4/9 \approx 1.778$. Choosing $d_0 = 2$ for $M\in[2,4)$ restores it, since then $W_0 = M - 4 \in [-2,0)$ against a lower bound of $\approx -2.222$. The alternative is to skip the first $i_0$ iterations entirely by tabulating $S_{i_0}$ from the leading bits of $M$ — see [[Square Root Seed Table]], which also shows why that table must round to nearest.

**One iteration, priced.** The residual register is a carry-save pair, $2(n{+}3)$ bits for `sfix(2,-n)` — the invariant caps $|W_i|$ at $2\rho S_i + \rho^2 \approx 3.1$, so two integer bits plus sign suffice. Multiplying by $\beta$ is a two-place shift of both words: **wiring, zero gates**. The digit multiple is $d(2S_i + \beta^{-i-1}d)$, which factors the awkward $\beta^{-i-1}d^2$ term into the product; since $|d| \le \gamma = 2$ the multiple is a shift by 0 or 1 and a sign, i.e. a mux, so **no multiplier appears anywhere in the datapath**. The recurrence then needs one 3:2 row for $(\beta w^s, \beta w^c, \text{multiple})$, or a 4:2 row if the multiple is itself split ([[Compressor Trees]]). The critical path is therefore selection LUT $\to$ mux $\to$ one carry-save row, **constant in $n$** — which is the entire payoff. What it costs on top: the $2^{t_W+t_S}$-entry selection table, and an [[On-the-Fly Converter]] to keep $S_i$ in standard binary at two muxes and two registers of $n{+}2$ bits per iteration.

**FPGA mapping inverts part of the argument.** On an FPGA the negative-digit subtraction $S_{i+1} = S_i + \beta^{-i-1}d_{-i-1}$ can be done directly with the hard carry chain at a latency comparable to computing $W_{i+1}$ itself — so the on-the-fly converter, an ASIC idiom, is not obviously worth its area. But doing that subtraction *per iteration* adds a second adder to the loop, and radix 4's whole claim was half as many iterations at the same per-iteration cost; twice as few iterations each twice as expensive is a wash against radix-2 [[Non-Restoring Square Root]], which is FloPoCo's current default. The escape is to convert only once at the end and feed the selection function a $\widetilde{S_i}$ accurate to $t_S$ only. For even $t_S$ the truncated tail is bounded by $\sum_{j\ge t_S/2}2\beta^{-j} = \rho\beta^{-t_S/2}$, adding the constraint $\widetilde{S_i} - \rho\beta^{-t_S/2} < S_i < \widetilde{S_i} + \rho\beta^{-t_S/2}$ and a possibly more expensive selection function. More broadly, fast carry logic makes plain two's-complement residuals cheap enough that the redundant representation is no longer automatically right on FPGA — the reference [[E-Method]] implementation drops it for exactly that reason.

$$\boxed{\;2(d-\rho)S_i + \beta^{-i-1}(d-\rho)^2 \;\le\; \beta W_i \;\le\; 2(d+\rho)S_i + \beta^{-i-1}(d+\rho)^2,\qquad \rho = \frac{\gamma}{\beta-1}\;}$$

## When it breaks

- **The selection function is not universal in $i$.** One shared table only exists for $i \ge i_0$ (3, for $\beta=4,\gamma=2$); iterations below that need their own logic or must be skipped by a seed table.
- **Minimal redundancy is not enough on its own.** $\rho \le 1$ always, and $\rho$ shrinks toward $1/2$ as $\beta$ grows at fixed $\gamma/\beta$; narrower overlap means more bits of $\widetilde{W_i}$ and $\widetilde{S_i}$, and the table grows as $2^{t_W+t_S}$. Past some radix the selection function costs more than the iterations it saves.
- **The final residual is still carry-save.** Its sign is what decides the last rounding bit, so one full carry-propagate assimilation is unavoidable at the end — the carry chain is deferred, not deleted.
- **A seed table that rounds down is infeasible, not merely worse:** the width constraint on $\ell$ then requires $\rho > 1$, which no digit set provides.
- **On FPGA the crossover moves.** With a hard carry chain, radix-2 non-restoring is the reported default; SRT wins where the per-iteration adder is genuinely the critical path, which is the ASIC case and the wide-significand case.

> [!warning] Not covered in the source — needs outside research
> Chapter 19 gives **no LUT, slice, delay or DSP figures** for any square-root variant, and no implementation-based comparison of SRT square root against restoring, non-restoring, Newton-Raphson or polynomial approximation. The only quantified head-to-head in the chapter is for the cube root (p. 589). Every cost statement above is structural (gate counts, widths, path composition), not measured.

> [!warning] Not covered in the source — needs outside research
> The trade-off between per-iteration on-the-fly conversion and a once-at-the-end conversion with a truncated $\widetilde{S_i}$ is stated but not resolved: p. 587 says explicitly that a complete study remains to be done, so there is no published answer on which side wins at a given radix and precision.

## RTL (Spade)

```spade
/// One iteration of the radix-4, gamma=2 SRT square-root recurrence.
///   W_{i+1} = beta*W_i - d*F_i,   F_i = 2 S_i + beta^{-i-1} d
/// The residual is kept in carry-save (ws, wc) with W = ws + wc, so no carry
/// crosses the whole word inside an iteration.
entity srt4_sqrt_iter<#uint N>(
    clk: clock,
    load: bool,
    w0: int<N>,
    f: int<N>,
    d: int<3>,
) -> (int<N>, int<N>) {
    decl ws, wc;

    // beta * W_i : a two-place left shift of both carry-save words, pure wiring
    let bs: int<N> = ws <<. 2;
    let bc: int<N> = wc <<. 2;

    // digit multiple |d| * F_i : |d| in {0,1,2}, so a shift and a mux
    let mag: int<N> = match d {
        2  => f <<. 1,
        1  => f,
        -1 => f,
        -2 => f <<. 1,
        _  => 0,
    };
    // subtracting is one's complement here; the missing +1 rides in on the
    // free LSB of the carry word
    let neg: bool = d > 0;
    let m:   int<N> = if neg { ~mag } else { mag };
    let cin: int<N> = if neg { 1 } else { 0 };

    // 3:2 carry-save row: sum + 2*carry = bs + bc + m + cin
    let maj: int<N> = (bs & bc) | (bs & m) | (bc & m);

    reg(clk) ws = if load { w0 } else { bs ^ bc ^ m };
    reg(clk) wc = if load { 0 }  else { (maj <<. 1) | cin };

    (ws, wc)
}
```

`f` carries $F_i = 2S_i$ with the selected digit concatenated at position $-i-1$, which is why $d \cdot F_i$ reproduces both the cross term $2dS_i$ and the trailing $\beta^{-i-1}d^2$ with a single shift-and-mux; `d` is the region label read off the P-D diagram, and $(w^s,w^c)$ sum to the diagram's $W_i$. Everything is combinational except the two residual registers, so the drawn path is selection $\to$ `mag` mux $\to$ 3:2 row — one full-adder delay wide, independent of `N`. Two things synthesis does differently from the picture: `<<. 2` and `<<. 1` vanish into routing, and the `~mag`/`cin` pair is how a subtraction survives without a carry chain — the $+1$ of the two's-complement negation rides in on the carry word's vacated LSB rather than propagating.

The digit selection itself is deliberately an input port here, not logic: it is a table whose contents come from the feasibility sweep in [[Square Root Digit Selection Function]], and building it into the recurrence would confuse two independent costs. The `load` mux on both residual registers is the loop control: $2N$ bits of 2:1 mux, plus an $\lceil\log_2 n\rceil$-bit iteration counter and the converter's registers. **A radix-4 operator needs $\lceil n/2 \rceil$ iterations for an $n$-bit root** — 27 for a binary64 significand, 24 once a seed table supplies $S_3$ — and this entity is instantiated **once**, not 24 times; unrolling it would reintroduce the area the digit recurrence exists to avoid.

*Verified: compiles under `spade 0.19.0`, and simulated — 4407 recurrence vectors (7 directed, including the deliberately asymmetric $d{=}{-}2, F{=}$`0x000101` and $d{=}{-}1,F{=}1$ against $W{=}128$, plus a 3000-vector random sweep over $d\in\{-2..2\}$) checked against $W_{i+1} = \beta W_i - dF_i$ modulo $2^{24}$, and 200 complete radix-4 square roots run to 7 iterations with the reference digit chosen from the boxed constraints, each final $S_7$ within $\rho\beta^{-7}$ of `$sqrt(M)`.*

## Related Notes

- [[SRT Division]] – compares: the same redundancy factor $\rho=\gamma/(\beta-1)$ and the same carry-save trick, but with a constant multiplicand, hence a one-dimensional selection function.
- [[Non-Restoring Square Root]] – compares: the non-redundant radix-2 baseline this must beat, and the one that currently wins on FPGA.
- [[Redundant Number Systems]] – depends-on: supplies the digit set whose overlap is what makes a truncated residual sufficient.
- [[CSA, Carry-Save Adder]] – depends-on: the 3:2 row that makes the per-iteration delay independent of width.
- [[Compressor Trees]] – extends: a 4:2 row absorbs a split digit multiple at the same delay, which is how higher radices keep the iteration flat.
- [[Square Root Digit Selection Function]] – extends: turns the boxed constraints plus a one-sided truncation error into the actual $2^{t_W+t_S}$-entry table.
- [[On-the-Fly Converter]] – supports: keeps $S_i$ in standard binary without an adder, so the second selection input is available every cycle.
- [[Square Root Seed Table]] – supports: skips the iterations below $i_0$ where no shared selection function exists.
- [[Fixed-Point Representations]] – depends-on: the `ufix`/`sfix` formats every width above is quoted in.
- [[Choosing a Digit Recurrence]] – compares: where this sits against the restoring, non-restoring and multiplier-based alternatives.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024 — Chapter 19, *Digit Recurrence for Algebraic Functions*.

- §19.1.2 generic radix-$\beta$ formulation and the recurrence (19.10) — pp. 575–576
- §19.1.5 exploiting redundant number systems: Eqs. (19.27)–(19.34), the redundancy factor (19.31), the residual invariant (19.32), the selection constraints (19.33)–(19.34) — pp. 580–582
- Fig. 19.4, P-D diagram at $i=0$ for $\beta=4$, $\gamma=2$ — p. 582
- Fig. 19.5, P-D diagram at $i=1$; the five reachable $S_1$, selection from 4 bits of $S_1$ and 5 bits of $W_1$, $S_2$ on 6 bits — p. 583
- §19.1.5.1 initialisation with $d_0\in\{1,2\}$ and the bound it repairs — pp. 582–583
- §19.1.5.3 carry-save truncation and the parameters $t_W = t_S = -4$, $i_0 = 3$ — p. 585
- §19.1.5.4 on-the-fly conversion, the FPGA alternative and the truncated-$\widetilde{S_i}$ constraint (19.45) — pp. 587–588
- FPGA mapping of redundant versus two's-complement residuals — p. 594
