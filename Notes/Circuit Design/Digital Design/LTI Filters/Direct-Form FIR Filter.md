---
title: "Direct-Form FIR Filter"
description: "Register chain feeding one constant multiplier per tap into an adder chain; the literal transcription of a convolution, at n+1 multipliers all fed by the narrow input word."
kind: circuit
source: "ASA §23.1.5.1, pp. 676-678; error budget from §23.3, pp. 688-694"
status: seed
spade: simulated
tags: [digital, lti-filters, fir, sopc, mcm, fixed-point]
aliases:
  - Direct Form FIR Filter
  - Direct-Form FIR
  - FIR Direct Form
  - Direct Form Non-Recursive Filter
---

# Direct-Form FIR Filter

The convolution sum written out as hardware — one register chain carrying the input word, one constant multiplier hanging off each tap, one adder chain underneath — and the only filter structure in which *both* the registers and the multiplier inputs stay at the raw input width, paid for with a critical path that runs through a multiplier and the entire adder chain.

```tikz title="Direct-form FIR datapath: tapped delay line, one constant multiplier per tap, adder chain and final rounding, with fixed-point formats and bit widths on every wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- tapped delay line, everything at the input width
  \draw[->] (-2.3,3) -- (0,3);
  \draw (0,3) -- (6,3);
  \node[anchor=south] at (-1.9,3.10) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.9,2.90) {sfix$(0,\ell)$, 8\,b};
  \draw[fill=black!8] (0.85,2.72) rectangle (1.15,3.28);
  \draw[fill=black!8] (2.85,2.72) rectangle (3.15,3.28);
  \draw[fill=black!8] (4.85,2.72) rectangle (5.15,3.28);
  \node[anchor=south, font=\tiny] at (1.95,3.10) {$u(k{-}1)$};
  \node[anchor=south, font=\tiny] at (3.95,3.10) {$u(k{-}2)$};
  \node[anchor=south, font=\tiny] at (5.95,3.10) {$u(k{-}3)$};
  \node[anchor=west, font=\tiny] at (6.3,3.0) {$n=3$ registers, 8\,b each};

  % ---- taps into the constant multipliers
  \draw[->] (0,3) -- (0,2.15); \fill (0,3) circle (0.05);
  \draw[->] (2,3) -- (2,2.15); \fill (2,3) circle (0.05);
  \draw[->] (4,3) -- (4,2.15); \fill (4,3) circle (0.05);
  \draw[->] (6,3) -- (6,2.15);
  \draw (-0.38,2.15) -- (0.38,2.15) -- (0,1.5) -- cycle; \node[font=\tiny] at (0,2.00) {$b_0$};
  \draw (1.62,2.15) -- (2.38,2.15) -- (2,1.5) -- cycle; \node[font=\tiny] at (2,2.00) {$b_1$};
  \draw (3.62,2.15) -- (4.38,2.15) -- (4,1.5) -- cycle; \node[font=\tiny] at (4,2.00) {$b_2$};
  \draw (5.62,2.15) -- (6.38,2.15) -- (6,1.5) -- cycle; \node[font=\tiny] at (6,2.00) {$b_3$};

  % ---- SOPC box around multipliers + adder chain
  \draw[dashed, gray] (-0.8,0.25) rectangle (6.9,2.45);
  \node[anchor=south west, font=\tiny, gray] at (-0.75,0.30) {SOPC};

  % ---- adder chain
  \draw (2,0.9) circle (0.22); \node[font=\tiny] at (2,0.9) {$+$};
  \draw (4,0.9) circle (0.22); \node[font=\tiny] at (4,0.9) {$+$};
  \draw (6,0.9) circle (0.22); \node[font=\tiny] at (6,0.9) {$+$};
  \draw[->] (0,1.5) -- (0,0.9) -- (1.78,0.9);
  \draw[->] (2,1.5) -- (2,1.12);
  \draw[->] (4,1.5) -- (4,1.12);
  \draw[->] (6,1.5) -- (6,1.12);
  \draw[->] (2.22,0.9) -- (3.78,0.9);
  \draw[->] (4.22,0.9) -- (5.78,0.9);
  \node[anchor=north, font=\tiny] at (3.0,0.78) {sfix$(m',\ell_{\mathrm{ext}})$, 14\,b};

  % ---- final rounding
  \draw (7.35,0.62) rectangle (8.75,1.18);
  \node[font=\tiny] at (8.05,0.9) {final round};
  \draw[->] (6.22,0.9) -- (7.35,0.9);
  \draw[->] (8.75,0.9) -- (10.1,0.9);
  \node[anchor=south, font=\tiny] at (9.45,1.06) {$\widetilde{y}_{\mathrm{out}}(k)$};
  \node[anchor=north, font=\tiny] at (9.45,0.74) {sfix$(m',\ell')$, 9\,b};

  % ---- coefficient format, clear of everything
  \node[anchor=north west, font=\tiny] at (-0.8,0.05)
    {$b_i$ quantised to sfix$(0,\ell_c)$, 12\,b --- 4 constant multipliers, 3 adders};
\end{circuitikz}
\end{document}
```

*after Fig. 23.7, p. 677, drawn at the order $n=3$ of the worked example and annotated with the formats of Fig. 23.17, p. 690.*

**A finite convolution has exactly one obvious architecture, and this is it.** A non-recursive difference equation evaluates (23.12) over finitely many terms, giving

$$y(k)=\sum_{i=0}^{n}b_i\,u(k-i),\qquad b_i=h(i),\qquad n=\operatorname*{argmax}\{h(k)\neq0\} \tag{23.14}$$

with $n$ the *order* and $n+1$ the *length* (p. 677). A signal-flow graph of (23.14) is built from exactly three abstract components — adder, multiplication by a constant, unit delay $\mathcal{D}$ — and a hardware implementation is obtained by replacing them, respectively, by adders, constant multipliers and clocked registers on a common clock (Fig. 23.6, p. 676; p. 677). Because the sum is finite, no output ever feeds back: the structure is *always* FIR, has no poles, and is BIBO-stable unconditionally — quantising the $b_i$ cannot move a pole outside the unit circle because there is no pole to move. Nothing else in [[LTI Filters]] gets stability for free.

**Read the graph literally and you get a *parallel* implementation, one sample per cycle.** As many multipliers work in parallel as the equation has multiplications, which is why the book calls it that (p. 677). The alternative readings — time-multiplex one multiplier over $n+1$ cycles, or go bit-serial, or compute several samples per cycle — trade throughput against area on the same equation and are all reachable from this drawing; the direct form is the fully-parallel corner.

**Every register in the chain holds the *input* word, and that single fact is the structure's cost argument.** Normalise the input peak to $\overline{u}=1$, legal because the filter is linear, so the input MSB sits at position $0$ and the format is `sfix(0, ℓ)` — $1-\ell$ bits, 8 for $\ell=-7$ ([[Number Formats]]). The delay line is a [[Tapped Delay Line]] of $n$ such registers, so it is as narrow as any realisation of this transfer function can be, and every multiplier sees an operand of that same width. Compare [[Direct Form II IIR Filter]], where the shared delay line sits *inside* the recursive loop and therefore carries `sfix(m', ℓ_ext)` — the registers are fewer but each is wider, and every $b_i$ multiplier grows with them. The direct form buys narrow arithmetic with unshared registers.

**The body is one sum of products by constants, not $n+1$ separate multipliers.** The multiplier–adder-chain block is an [[SOPC, Sum of Products by Constants]], and treating it as a single operator is what makes the structure cheap. Each product $b_i\,u(k-i)$ is a sum of shifted copies of one input word, so the whole SOPC is *literally one* [[Bit Heaps|bit heap]] — one column-wise accumulation of weighted bits, compressed once and carry-propagated once ([[Sums of Weighted Bits]]). Building $n+1$ multipliers, rounding each, and then adding the results spends $n+1$ roundings where one suffices. Independently of that, the $n+1$ constants share subexpressions, so the whole set costs far fewer adders than $n+1$ multipliers would: that is exactly the [[Multiple Constant Multiplication]] problem, and it is why the honest cost metric for a FIR filter is *adder count*, not multiplier count.

**With no feedback, the error filter degenerates to the identity — this is the entire quantitative difference from IIR.** The general error analysis of §23.3 lets $\delta_{\text{r}}$ be the SOPC's own error and $\delta_{\text{t}}=\widetilde{y}-y$ the error actually reaching the output; they are related by an IIR filter whose transfer function is the original one with its numerator deleted,

$$\mathcal{H}_\delta(z)=\frac{1}{1+\sum_{i=1}^{n}a_iz^{-i}} \tag{23.33}$$

Here every $a_i=0$, so $\mathcal{H}_\delta(z)=1$ and its worst-case peak gain $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=\sum_k|h_\delta(k)|=1$. Substituting into the guard-bit formula (23.37), $\ell_{\text{ext}}=\ell'-1-\lceil\log_2 1\rceil$: **one** guard bit below the output LSB, spent on the final round-to-nearest, and none at all on error amplification. The second-order bell resonator of p. 694, with $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.28\times10^6$, needs 22. A FIR filter's rounding error simply exits; an IIR filter's circulates.

**The worst-case peak gain is just $\sum|b_i|$, and it fixes the output MSB.** For a FIR filter the impulse response *is* the coefficient vector, so (23.22) reads $\langle\!\langle\mathcal{H}\rangle\!\rangle=\sum_{i=0}^{n}|b_i|$ — a finite sum you can evaluate by hand rather than a limit to be bounded numerically. Feeding it into (23.24),

$$m'\le\left\lceil\log_2\!\left(\textstyle\sum_i|b_i|+2^{\ell'}\right)\right\rceil$$

so the output format `sfix(m', ℓ')` is decided by the coefficients alone, with $\ell'$ coming from the accuracy requirement. The adversarial input that attains the bound is constructive: $u(k-i)=\operatorname{sign}(b_i)$, which is what a FIR test bench should drive first.

**Worked example — a 4-tap FIR, from error budget to coefficient width.** Target $b=(0.1,\,0.3,\,0.4,\,0.2)$, DC gain 1. Input `sfix(0,-7)`: 8 bits, $\overline{u}=1$, $\text{ulp}_{\text{in}}=2^{-7}$. Required output `sfix(m',-7)`, faithful, so $\overline{\delta_{\text{total}}}<2^{-7}$ ([[Error Accuracy]]).

*Output format.* All coefficients positive, so $\langle\!\langle\mathcal{H}\rangle\!\rangle=\sum|b_i|=1.0$ and $m'\le\lceil\log_2(1+2^{-7})\rceil=1$: output `sfix(1,-7)`, 9 bits.

*Budget split.* Round-to-nearest at the output eats $\overline{\delta_{\text{final round}}}=2^{\ell'-1}=2^{-8}$, leaving $\overline{\delta_{\text{r}}}<2^{-8}$ by (23.36). Halve that again: $2^{-9}$ for coefficient quantisation, $2^{-9}$ for datapath truncation.

*Coefficient width.* Quantising to LSB $\ell_c$ with round-to-nearest gives $|\varepsilon_i|\le2^{\ell_c-1}$ per tap. The perturbed filter differs from the ideal one by an FIR filter with impulse response $\varepsilon$, whose WCPG is $\sum|\varepsilon_i|$ — the same $\sum|h|$ formula, applied to the error filter rather than to $\mathcal{H}$ — so the output is displaced by at most

$$\sum_{i=0}^{3}|\varepsilon_i|\cdot\overline{u}\;\le\;4\cdot2^{\ell_c-1}=2^{\ell_c+1}\;<\;2^{-9}\quad\Longrightarrow\quad \ell_c\le-11$$

**11 fractional bits, i.e. a 12-bit signed coefficient** in `sfix(0,-11)`. Quantising at $2^{-11}$:

| $b_i$ | $\widehat{b}_i\cdot2^{11}$ | $\widehat{b}_i$ in binary | $\varepsilon_i$ (in $2^{-11}$) |
| --- | --- | --- | --- |
| $0.1$ | $205$ | $0.00011001101$ | $+0.2$ |
| $0.3$ | $614$ | $0.01001100110$ | $-0.4$ |
| $0.4$ | $819$ | $0.01100110011$ | $-0.2$ |
| $0.2$ | $410$ | $0.00110011010$ | $+0.4$ |

$\sum|\varepsilon_i|=1.2\cdot2^{-11}=2.4\cdot2^{-12}$, comfortably under the $2^{-9}=8\cdot2^{-12}$ allowance. Note $205+614+819+410=2048$ exactly: the DC gain is still precisely 1, so $\langle\!\langle\widehat{\mathcal{H}}\rangle\!\rangle=1$ survives quantisation and $m'=1$ needs no re-derivation.

*Datapath width.* Building the four products independently and truncating each to $\ell_{\text{ext}}$ costs four errors of $<2^{\ell_{\text{ext}}}$:

$$4\cdot2^{\ell_{\text{ext}}}=2^{\ell_{\text{ext}}+2}<2^{-9}\quad\Longrightarrow\quad \ell_{\text{ext}}\le-12$$

Internal format `sfix(1,-12)`, 14 bits — **5 guard bits** below the output LSB, four of them bought purely by rounding four times instead of once. Built as a single bit heap the budget is the one guard bit that (23.37) predicts, and three of the five disappear.

*One sample.* Take $u(k{-}3\ldots k)$ in `sfix(0,-7)`:

$$u(k)=0.1001101,\quad u(k{-}1)=-0.0101101,\quad u(k{-}2)=0.1100101,\quad u(k{-}3)=0.0010011$$

i.e. $(77,-45,101,19)\cdot2^{-7}$. Exact products, as integers scaled by $2^{-18}$: $205\cdot77=15785$, $614\cdot(-45)=-27630$, $819\cdot101=82719$, $410\cdot19=7790$. Truncating each to $2^{-12}$ (drop 6 LSBs, round toward $-\infty$):

| product | exact $/2^{-12}$ | truncated | error $/2^{-12}$ |
| --- | --- | --- | --- |
| $b_0u(k)$ | $246.640625$ | $246=\texttt{11110110}$ | $-0.640625$ |
| $b_1u(k{-}1)$ | $-431.71875$ | $-432$ | $-0.28125$ |
| $b_2u(k{-}2)$ | $1292.484375$ | $1292=\texttt{10100001100}$ | $-0.484375$ |
| $b_3u(k{-}3)$ | $121.71875$ | $121=\texttt{1111001}$ | $-0.71875$ |

Sum $246-432+1292+121=1227$, so $\widetilde{y}=1227\cdot2^{-12}=0.299560546875$. Total truncation error $-2.125\cdot2^{-12}$, inside the bound $4\cdot2^{-12}$; coefficient error contributes $+0.325\cdot2^{-12}$, inside $2.4\cdot2^{-12}$. The ideal output is $y=(7.7-13.5+40.4+3.8)/128=0.3$ exactly, so $\delta_{\text{r}}=-2^{-11}$, and since $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1$ that is $\delta_{\text{t}}$ unchanged. Final rounding: $\widetilde{y}\cdot2^{7}=38.34375\to38$, so $\widetilde{y}_{\text{out}}=38\cdot2^{-7}=0.296875$ and

$$\delta_{\text{total}}=0.296875-0.3=-0.003125=-0.4\ \text{ulp}\quad\checkmark$$

Had this been an IIR filter with $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.28\times10^6$, that same $\delta_{\text{r}}=-2^{-11}$ would have produced an output error of up to $625$ — about $2^{16}$ ulps — and 22 further guard bits would have been the price of the same one-ulp promise.

$$\boxed{\ y(k)=\sum_{i=0}^{n}b_i\,u(k-i)\ \ \Longrightarrow\ \ \langle\!\langle\mathcal{H}\rangle\!\rangle=\sum_{i=0}^{n}|b_i|,\quad\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1,\quad\ell_{\text{ext}}=\ell'-1\ }$$

> [!warning] Not covered in the source — needs outside research
> Chapter 23 gives no LUT, slice, DSP or delay figures for any filter structure, and does not map the direct form onto FPGA primitives. Whether each tap should become a DSP block (whose registered input and output ports absorb the delay line and the pipeline registers for free) or a LUT-based [[Multiple Constant Multiplication]] network is deferred entirely to Ch. 12; see [[FPGAs]]. The only hard cost comparison the chapter offers anywhere is the 37-versus-23 adder table of the ILP example, p. 700.

**When it breaks.** The adder chain is the ceiling: the combinational path runs through one constant multiplier and then all $n$ adders, so beyond a handful of taps the direct form fails timing where [[Transposed Direct-Form FIR Filter]] — which puts a register between every pair of structural adders — does not, at identical multiplier width and identical arithmetic. Reassociating the chain into a balanced tree of depth $\lceil\log_2(n{+}1)\rceil$ recovers most of it and is legal by associativity of addition, but the tree is only exactly equivalent to the chain when the additions are exact, which is the argument for keeping the whole SOPC as one unrounded bit heap. The independent-truncation budget above degrades as $O(n)$: rounding each product separately costs $n{+}1$ errors, so at 25 taps the same $2^{-9}$ allowance demands three more guard bits than at four, and the heap formulation stops being an optimisation and becomes necessary. The $n+1$ separate multipliers are also the wrong count whenever the coefficients are symmetric — a linear-phase filter has $b_i=b_{n-i}$, both operands are already present in the same delay line, so pre-adding $u(k-i)+u(k-n+i)$ before one multiplier halves the multiplier count ([[Linear-Phase FIR Filter]]). Finally, FIR pays for its unconditional stability with length: for the same transition band a FIR filter needs a far longer impulse response than an IIR one (p. 685), so once the tap count runs into the hundreds the guard bits an IIR structure demands are the cheaper purchase.

```spade
/// 4-tap direct-form FIR, the worked example above.
///   u  : sfix(0,-7)   8 b, value u*2^-7 in [-1,1)
///   b_i: sfix(0,-11) 12 b, (0.1,0.3,0.4,0.2) quantised to (205,614,819,410)
///   tap: sfix(1,-12) 14 b, each product truncated to l_ext = -12
///   y  : sfix(1,-7)   9 b, round-to-nearest
fn tap(u: int<8>, b: int<18>) -> int<14> {
    trunc((sext::<8, 18>(u) *. b) >>> 6)
}

entity fir4(clk: clock, rst: bool, u: int<8>) -> int<9> {
    reg(clk) u1 reset(rst: 0) = u;
    reg(clk) u2 reset(rst: 0) = u1;
    reg(clk) u3 reset(rst: 0) = u2;
    let s: int<14> = tap(u, 205) +. tap(u1, 614) +. tap(u2, 819) +. tap(u3, 410);
    trunc((s +. 16) >>> 5)
}
```

`u1`–`u3` are the three shaded boxes of the delay line, all 8 bits wide, and the four `tap` calls are the four triangles. Inside `tap`, `sext` to 18 bits then `*.` is the exact product at LSB $2^{-18}$ ($|819\cdot(-128)|<2^{17}$, so nothing wraps), and `>>> 6` is the truncation to $\ell_{\text{ext}}=-12$ — an arithmetic shift right *is* rounding toward $-\infty$ on two's complement, which is the $\lfloor\cdot\rfloor$ the error table assumes. `s` is the adder-chain output in `sfix(1,-12)`, and `(s +. 16) >>> 5` is the final round box: $16=2^{\ell'-1}$ in units of $2^{-12}$, using $\lfloor x\rceil=\lfloor x+\tfrac12\rfloor$ ([[Rounding]]). Everything but the delay line is combinational, so the drawn critical path is real. Synthesis will not build four multipliers: with constant operands each `*.` collapses to a shift-and-add network, and a good tool will share subexpressions across all four — the [[Multiple Constant Multiplication]] the drawing hides inside four identical triangles.

Simulated with `.zettel/sim.sh` over 3024 vectors against a behavioural reference, all passing: the asymmetric worked-example sequence $(19,101,-45,77)$ reproducing $\widetilde{y}_{\text{out}}=38$, a separate impulse of amplitude $64\cdot2^{-7}$ read out over four cycles as $(6,19,26,13)$ — which is the check that catches a reversed tap order, since a symmetric vector would pass either way — the extreme codes $1$, $-128$, $127$, $-1$ in sequence, and a 3000-sample random sweep. Every vector was additionally checked against the *ideal* filter $\sum b_iu(k-i)$ with unquantised $b$: worst observed $|\widetilde{y}_{\text{out}}-y|=0.6$ ulp, faithful, and consistent with the $0.5+0.5$ budget split derived above.

## Related Notes

- [[Transposed Direct-Form FIR Filter]] – extends: same coefficients and the same narrow input word, but the structural adders are separated by the delay registers, cutting the critical path to one multiplier and one adder.
- [[SOPC, Sum of Products by Constants]] – depends-on: the multiplier-plus-adder-chain block this structure is built around, and where its error $\delta_{\text{r}}$ is bounded.
- [[Tapped Delay Line]] – depends-on: the $n$ input-width registers that produce $u(k{-}1)\ldots u(k{-}n)$.
- [[Bit Heaps]] – supports: the whole SOPC is one heap, which is what turns $n{+}1$ roundings into one.
- [[Sums of Weighted Bits]] – supports: every partial product is a shifted copy of an input word, so the filter body is a single weighted-bit accumulation.
- [[Multiple Constant Multiplication]] – supports: the $n{+}1$ constants share subexpressions, which is why adder count and not multiplier count is the cost metric.
- [[Error Accuracy]] – supports: supplies faithfulness, the ulp bound and the budget-halving used throughout the worked example.
- [[Linear-Phase FIR Filter]] – extends: symmetric coefficients let two taps of this same delay line share one multiplier.
- [[Minimum-Adder FIR Filter]] – extends: stops treating the $b_i$ as given and optimises coefficients and adder graph together against the frequency mask.
- [[Direct Form I IIR Filter]] – compares: the same SOPC with feedback taps appended, where $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle>1$ and guard bits stop being free.
- [[Direct Form II IIR Filter]] – counter-example: shares the delay line at the cost of putting it inside the loop, so its $b_i$ multipliers see `sfix(m', ℓ_ext)` instead of the input word.
- [[Choosing a Filter Structure]] – compares: where this sits against every sibling on multipliers, registers, critical path and quantisation behaviour.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.5, p. 677 — filter structures as adders, constant multipliers and registers; parallel implementation.
- §23.1.5.1, pp. 677–678 — non-recursive filters, (23.14), order and length, Fig. 23.7 (direct form) and Fig. 23.8 (transposed form, structural adders).
- §23.1.4, p. 676 — BIBO stability and $\sum_k|h(k)|$.
- §23.3.1, pp. 689–690 — worst-case peak gain, Defs. 23.4–23.5, (23.20)–(23.23).
- §23.3.2, pp. 690–691 — interface, normalisation of $\overline{u}$, output MSB (23.24), the extended internal format, Fig. 23.17.
- §23.3.3–23.3.5, pp. 691–694 — error decomposition (23.25)–(23.30), the error filter (23.33), and the guard-bit formula (23.37); the bell-resonator instance with $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.28\times10^6$.
- §23.4.4, pp. 699–700 — linear-phase symmetry and the 37-versus-23 adder comparison.
