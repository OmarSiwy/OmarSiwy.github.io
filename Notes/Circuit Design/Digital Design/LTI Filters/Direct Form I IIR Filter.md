---
title: Direct Form I IIR Filter
description: "One SOPC over both the input and the fed-back output history; the cheapest multipliers of any IIR form because the b_i see the narrow input, paid for with two unshared delay lines."
kind: circuit
source: "ASA §23.1.5.2 and §23.3.3-23.3.5, pp. 678-694"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, sopc, feedback, fixed-point]
aliases:
  - DF-I
  - DF1 IIR
  - Direct Form 1 IIR Filter
  - Direct-Form I IIR
---

# Direct Form I IIR Filter

The literal transcription of a recursive difference equation into hardware: one sum of products by constants taken over two separate delay lines, one holding past inputs and one holding past outputs.

```tikz title="Direct form I IIR filter of order 2: input delay line, output delay line, one SOPC, and the two roundings"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % ---- input delay line, left, flowing right
  \draw[->] (-1.8,3) -- (2.6,3);
  \node[anchor=south] at (-1.5,3.06) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.0,2.92) {sfix$(0,\ell)$};
  \draw[fill=black!8] (0.5,2.72) rectangle (0.8,3.28);
  \draw[fill=black!8] (1.8,2.72) rectangle (2.1,3.28);
  \node[anchor=south, font=\tiny] at (1.3,3.06) {$u(k{-}1)$};
  \node[anchor=south, font=\tiny] at (2.6,3.06) {$u(k{-}2)$};

  % ---- output delay line, right, flowing LEFT
  \draw (6.6,3) -- (3.9,3);
  \draw[->] (5.3,3) -- (5.15,3);
  \draw[->] (4.0,3) -- (3.9,3);
  \draw[fill=black!8] (5.7,2.72) rectangle (6.0,3.28);
  \draw[fill=black!8] (4.4,2.72) rectangle (4.7,3.28);
  \node[anchor=south, font=\tiny] at (5.2,3.06) {$\widetilde{y}(k{-}1)$};
  \node[anchor=south, font=\tiny] at (3.9,3.06) {$\widetilde{y}(k{-}2)$};

  % ---- SOPC frame
  \draw[dashed, black!55] (-0.55,0.05) rectangle (7.0,2.35);
  \node[anchor=south west, font=\tiny] at (-0.5,0.1) {SOPC};

  % ---- taps into multipliers
  \draw[->] (0,3) -- (0,2.1);
  \draw[->] (1.3,3) -- (1.3,2.1);
  \draw[->] (2.6,3) -- (2.6,2.1);
  \draw[->] (3.9,3) -- (3.9,2.1);
  \draw[->] (5.2,3) -- (5.2,2.1);
  \draw (-0.35,2.1) -- (0.35,2.1) -- (0,1.5) -- cycle;   \node[font=\tiny] at (0,1.92) {$b_0$};
  \draw (0.95,2.1) -- (1.65,2.1) -- (1.3,1.5) -- cycle;  \node[font=\tiny] at (1.3,1.92) {$b_1$};
  \draw (2.25,2.1) -- (2.95,2.1) -- (2.6,1.5) -- cycle;  \node[font=\tiny] at (2.6,1.92) {$b_2$};
  \draw (3.5,2.1) -- (4.3,2.1) -- (3.9,1.5) -- cycle;    \node[font=\tiny] at (3.9,1.92) {$-a_2$};
  \draw (4.8,2.1) -- (5.6,2.1) -- (5.2,1.5) -- cycle;    \node[font=\tiny] at (5.2,1.92) {$-a_1$};

  % ---- adder chain
  \draw (1.3,0.9) circle (0.22); \node at (1.3,0.9) {$+$};
  \draw (2.6,0.9) circle (0.22); \node at (2.6,0.9) {$+$};
  \draw (3.9,0.9) circle (0.22); \node at (3.9,0.9) {$+$};
  \draw (5.2,0.9) circle (0.22); \node at (5.2,0.9) {$+$};
  \draw[->] (0,1.5) -- (0,0.9) -- (1.08,0.9);
  \draw[->] (1.3,1.5) -- (1.3,1.12);
  \draw[->] (2.6,1.5) -- (2.6,1.12);
  \draw[->] (3.9,1.5) -- (3.9,1.12);
  \draw[->] (5.2,1.5) -- (5.2,1.12);
  \draw[->] (1.52,0.9) -- (2.38,0.9);
  \draw[->] (2.82,0.9) -- (3.68,0.9);
  \draw[->] (4.12,0.9) -- (4.98,0.9);
  \node[anchor=north, font=\tiny] at (3.3,0.68) {one full-precision heap};

  % ---- single rounding at the foot of the heap
  \draw[fill=black!5] (5.75,0.62) rectangle (6.85,1.18);
  \node[font=\tiny] at (6.3,0.9) {round};
  \draw[->] (5.42,0.9) -- (5.75,0.9);
  \draw (6.85,0.9) -- (7.6,0.9);
  \fill (7.35,0.9) circle (0.05);

  % ---- feedback path back to the delay line
  \draw[->] (7.35,0.9) -- (7.35,3.55) -- (6.6,3.55) -- (6.6,3.05);
  \node[anchor=west, font=\tiny] at (7.42,2.2) {$\widetilde{y}(k)$};
  \node[anchor=west, font=\tiny] at (7.42,1.9) {sfix$(m',\ell_{\text{ext}})$};

  % ---- final rounding
  \draw[fill=black!5] (7.6,0.62) rectangle (8.85,1.18);
  \node[font=\tiny] at (8.22,0.9) {final round};
  \draw[->] (8.85,0.9) -- (9.9,0.9);
  \node[anchor=south, font=\tiny] at (9.4,0.98) {$\widetilde{y}_{\text{out}}(k)$};
  \node[anchor=north, font=\tiny] at (9.4,0.78) {sfix$(m',\ell')$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.9a, p. 679, with the formats and SOPC framing of Fig. 23.17, p. 690.*

**Transcribe the difference equation, component for component.** A recursive filter of orders $n$ (feed-forward) and $m$ (feedback) is specified by

$$y(k)=\sum_{i=0}^{n}b_i\,u(k-i)-\sum_{i=1}^{m}a_i\,y(k-i) \tag{23.15}$$

and the signal-flow graph needs exactly three abstract components — adder, multiplication by a constant, unit delay — each of which is itself an LTI filter (p. 676). Direct form I is what you get by replacing each occurrence *in place*: $u(k-i)$ becomes a tap on a [[Tapped Delay Line]] clocked at the sample rate, $b_i$ and $-a_i$ become constant multipliers, and the two sums become one adder chain. Nothing is factored, nothing is reordered; that is the definition of the form, and the reason it is the baseline every other structure is measured against. Cost: $n+m+1$ constant multiplications, $n+m$ registers, one output sample per cycle.

**Read the two sums as a single SOPC and the arithmetic collapses to one problem.** Concatenate the two histories into one vector $\big(u(k),\dots,u(k-n),\widetilde{y}(k-1),\dots,\widetilde{y}(k-m)\big)$ against the constant vector $(b_0,\dots,b_n,-a_1,\dots,-a_m)$, and the body of the filter is a single [[SOPC, Sum of Products by Constants]]. Every partial product is a shifted copy of a stored word, so the whole SOPC is one column-wise accumulation of weighted bits — see [[Sums of Weighted Bits]] — compressed once and carry-propagated once. The alternative that Fig. 23.17 actually draws, one `round` box per product, throws accuracy away $n+m+1$ times where a heap throws it away once, at strictly higher hardware cost. The constants share subexpressions across the whole vector, which is the [[Multiplication by Constants]] problem, not $n+m+1$ independent multipliers.

**The two delay lines carry different formats, and that asymmetry is the form's identity.** The input line holds $u(k-i)$ in the interface format `sfix(0, ℓ)` — the MSB is $0$ because we normalise $\overline{u}=1$ without loss of generality, the filter being linear — so it is exactly as wide as the ADC or the previous stage delivers. The output line holds $\widetilde{y}(k-i)$ in the *extended* internal format `sfix(m', ℓ_ext)`, wider than the output format because it lives inside the loop. Consequently the $b_i$ multipliers are narrow and only the $a_i$ multipliers are wide. Registers are the mirror image: with $m=n$ the two lines hold different values and cannot be shared, so direct form I pays $n+m$ registers where [[Direct Form II IIR Filter]] pays $\max(n,m)$. See [[Number Formats]] for the `sfix` notation itself.

> [!important] Multiplier width, not register count, decides direct form I against direct form II
> Direct form II is obtained by viewing this structure as a cascade of two filters and commuting them — legal by commutativity of convolution — after which both delay lines hold the same $t'(k)$ and merge. It looks unambiguously cheaper. But $t'(k)$ is the loop signal, so in direct form II *every* multiplier, including all the $b_i$, sees the extended format. A stable implementation of direct form II may still win overall, but not for the reason the register count suggests (p. 681).

**One rounding error per sample becomes an infinite sum, and the loop gain is computable.** Let $y$ be the ideal output, $\widetilde y$ the internal value, $\widetilde y_{\text{out}}$ the rounded output, $\delta_{\text{t}}=\widetilde y-y$ and $\delta_{\text{final round}}=\widetilde y_{\text{out}}-\widetilde y$, so that $\delta_{\text{total}}=\delta_{\text{final round}}+\delta_{\text{t}}$ (23.29). Let $\delta_{\text{r}}(k)$ be the error of the SOPC alone (23.30): the hardware SOPC measured against an ideal one that uses infinitely accurate $a_i,b_i$ but is fed the *same* finite-precision operands, so $\delta_{\text{r}}$ absorbs coefficient quantisation and datapath rounding and nothing else. Substituting $\widetilde y(k-i)=y(k-i)+\delta_{\text{t}}(k-i)$ into (23.30) and collapsing the first three terms **by (23.15) itself** gives $\delta_{\text{r}}(k)=\delta_{\text{t}}(k)+\sum_{i=1}^{m}a_i\delta_{\text{t}}(k-i)$, i.e.

$$\delta_{\text{t}}(k)=\delta_{\text{r}}(k)-\sum_{i=1}^{m}a_i\,\delta_{\text{t}}(k-i) \tag{23.32}$$

which is *itself* an equation of the form (23.15): an IIR filter with input $\delta_{\text{r}}$, output $\delta_{\text{t}}$ and transfer function $\mathcal H_\delta(z)=1/\big(1+\sum_i a_iz^{-i}\big)$ (23.33). **The error filter is the filter with its numerator deleted** — same poles, and the poles worth building an IIR filter for sit near the unit circle. Applying the worst-case peak gain theorem to it, $\overline{\delta_{\text{t}}}=\langle\!\langle\mathcal H_\delta\rangle\!\rangle\,\overline{\delta_{\text{r}}}$ (23.34), where $\langle\!\langle\cdot\rangle\!\rangle=\sum_k|h(k)|$ is the same sum whose convergence defines BIBO stability.

**Buy the loop off with guard bits below the output LSB.** Faithfulness — see [[Rounding]] and [[Error Accuracy]] for one-ulp accuracy — demands $\overline{\delta_{\text{total}}}<2^{\ell'}$. Round-to-nearest at the output spends $2^{\ell'-1}$, exactly half the budget, leaving $\overline{\delta_{\text{r}}}<2^{\ell'-1}/\langle\!\langle\mathcal H_\delta\rangle\!\rangle$ (23.36); a faithful SOPC guarantees $\overline{\delta_{\text{r}}}<2^{\ell_{\text{ext}}}$, so taking logarithms gives (23.37) below. The output MSB comes from the same WCPG machinery applied to $\mathcal H$ itself: $m'\le\lceil\log_2(\langle\!\langle\mathcal H\rangle\!\rangle+2^{\ell'})\rceil$ (23.24). Internal overflow above $m'$ is harmless, because fixed-point computation is modulo $2^{m'}$ and the final result is still correct (p. 691). For an FIR filter all $a_i=0$, so $\mathcal H_\delta(z)=1$ and $\langle\!\langle\mathcal H_\delta\rangle\!\rangle=1$: exactly one guard bit. The entire quantitative difference between [[Direct-Form FIR Filter]] and this note is the size of that logarithm.

**A worked instance, to make the widths concrete.** Take $n=m=2$, $b=(0.1001,\,0.2998,\,0.0498)$ and $a=(-1.5,\,0.7002)$, both quantised at $2^{-11}$ — 13-bit signed integers $205, 614, 102$ and $-3072, 1434$ — with input `sfix(0,-7)` and a required output LSB $\ell'=-7$. The poles sit at radius $\sqrt{0.7}=0.837$. Summing the impulse responses per (23.22) gives $\langle\!\langle\mathcal H\rangle\!\rangle=4.10$, so (23.24) gives $m'=\lceil\log_2(4.10+2^{-7})\rceil=3$ and the output is `sfix(3,-7)`, 11 bits. The error filter has $\langle\!\langle\mathcal H_\delta\rangle\!\rangle=9.28$, so $\ell_{\text{ext}}=-7-1-\lceil\log_2 9.28\rceil=-12$: **five guard bits**, and $\widetilde y$ is `sfix(3,-12)`, 16 bits. The heap needs no rounding on the way in — $b_i\cdot u(k-i)$ lands at $2^{-18}$ and $a_i\cdot\widetilde y(k-i)$ at $2^{-23}$, so aligning everything to $2^{-23}$ in a 32-bit accumulator is exact, and the single round to $2^{-12}$ at the foot of the heap is the only place $\delta_{\text{r}}$ is created.

**On FPGA the register asymmetry partly reverses.** Both delay lines are addressed strictly sequentially and never read out of order, so on Xilinx and Altera fabric they map onto LUT-based shift registers rather than onto flip-flops, at a few taps per LUT per bit of width instead of one flip-flop per tap per bit — which weakens direct form II's register-sharing advantage precisely where direct form I is already ahead on multiplier width. The $b_i$ taps at input width fit one DSP block each; the $a_i$ taps at `sfix(m', ℓ_ext)` may not, and that is where the extended format is actually paid for. On ASIC there is no such asymmetry — a register is a register — and the sharing argument stands unmodified. See [[FPGAs]].

> [!warning] Not covered in the source — needs outside research
> Ch. 23 gives no FPGA mapping for filter structures and no LUT, slice or DSP count for any of them; it defers all constant-multiplication mapping to Ch. 12 (p. 697). The shift-register claim above is standard FPGA canon rather than this book, and the taps-per-LUT ratio is a device-family property that must be checked against the target before it enters a cost model.

$$\boxed{\ \widetilde y(k)=\circ\!\left(\sum_{i=0}^{n}b_i\,u(k-i)-\sum_{i=1}^{m}a_i\,\widetilde y(k-i)\right),\qquad \ell_{\text{ext}}=\ell'-1-\big\lceil\log_2\langle\!\langle\mathcal H_\delta\rangle\!\rangle\big\rceil\ }$$

with $\circ$ a single round-to-nearest at the foot of the heap and $\mathcal H_\delta(z)=1/(1+\sum_i a_iz^{-i})$.

**When it breaks.**

- **The WCPG bound is a guarantee, not a typical case.** Some bell-model resonators have $\langle\!\langle\mathcal H\rangle\!\rangle\approx2\times10^5$, which (23.24) turns into $m'=18$; the real excitation is a sequence of distant impulses, not an adversarial signal, so the application should override $m'$ from the peak of the impulse response (p. 691).
- **High order is the wrong regime.** Direct form I is badly conditioned as $n,m$ grow: the poles are the roots of one high-degree polynomial, so coefficient quantisation moves all of them at once and can push a pole outside the unit circle. Past order four or so, hand the job to a [[Biquad Cascade]], whose sections have independent poles.
- **No pipelining inside the loop.** Registers may be inserted freely in the $b_i$ forward path, but a register added anywhere on the $a_i$ path changes the difference equation and therefore changes the filter. The critical path — one multiplier plus the adder chain — is a hard floor on $f_{\max}$; the escapes are a lower order, a faster adder tree, or [[Transposed Direct Form I IIR Filter]], which trades the chain for an MCM.
- **$\langle\!\langle\mathcal H_\delta\rangle\!\rangle$ near $10^6$ makes the guard bits dominate.** A second-order bell resonator needs 22 of them (p. 694). At that point the internal datapath is wider than the operands it multiplies, and the comparison against direct form II is decided entirely by $\ell_{\text{ext}}$.
- **Faithfulness bounds limit cycles, it does not remove them.** A hardware filter has no transfer function and no poles, because all three notions presuppose linearity; what a faithful implementation promises is that any limit cycle around a converged value stays below one ulp.

**RTL.** The worked instance above: order 2, $b=(205,614,102)/2^{11}$, $-a=(3072,-1434)/2^{11}$.

```spade
// Direct form I IIR, order 2.  u: sfix(0,-7)  ->  y_out: sfix(3,-7)
entity df1_iir2(clk: clock, rst: bool, u: int<8>) -> int<11> {
    // input delay line, sfix(0,-7)
    reg(clk) u1 reset(rst: 0) = u;
    reg(clk) u2 reset(rst: 0) = u1;

    decl yw;
    // output delay line, sfix(3,-12)
    reg(clk) y1: int<16> reset(rst: 0) = yw;
    reg(clk) y2: int<16> reset(rst: 0) = y1;

    let b0: int<13> = 205;
    let b1: int<13> = 614;
    let b2: int<13> = 102;
    let ma1: int<16> = 3072;
    let ma2: int<16> = -1434;

    // forward taps: b_i * u(k-i) is int<26> at 2^-18, shifted to the 2^-23 heap scale
    let f0: int<32> = sext::<26, 32>(b0 * sext::<8, 13>(u)) << 5;
    let f1: int<32> = sext::<26, 32>(b1 * sext::<8, 13>(u1)) << 5;
    let f2: int<32> = sext::<26, 32>(b2 * sext::<8, 13>(u2)) << 5;
    // feedback taps: (-a_i) * y(k-i) is int<32> at 2^-23 already
    let g1: int<32> = ma1 * y1;
    let g2: int<32> = ma2 * y2;

    // one bit heap, one rounding: sfix(3,-23) -> sfix(3,-12)
    let acc: int<32> = f0 +. f1 +. f2 +. g1 +. g2;
    let yw: int<16> = trunc((acc +. 1024) >>> 11);

    // final rounding: sfix(3,-12) -> sfix(3,-7)
    trunc((yw +. 16) >>> 5)
}
```

`u1`/`u2` are the two input-line registers and `y1`/`y2` the two output-line registers — the unshared pair the diagram is about, 8 bits wide and 16 bits wide respectively. `decl yw` is the feedback wire, used by the registers before it is defined; the loop is legal rather than combinational because the only path from `yw` back to itself passes through `reg(clk)`. The width arithmetic is the heap alignment: `int<13> * int<13> = int<26>` at $2^{-18}$, shifted left 5 onto the common $2^{-23}$ scale, against `int<16> * int<16> = int<32>` already there, with `+.` (truncating add) holding the accumulator at 32 bits; the two `(x + half) >>> shift` idioms are the `round` and `final round` boxes. Synthesis will not build the drawn adder chain — the five products go into one compressor tree with a single carry-propagate adder, and both roundings fold into that adder's low bits.

Simulated against a behavioural reference over 3111 vectors — unit impulse, an asymmetric $1,-128,1$ burst, a step and 3000 random samples — all passing; perturbing $b_1$ from 614 to 613 fails 278 of them, so the vectors do bite.

**Related Notes.**

- [[SOPC, Sum of Products by Constants]] – depends-on: the entire body of this filter is one instance of it, over the concatenated input and output histories.
- [[Tapped Delay Line]] – depends-on: both delay lines, one at input width and one at internal width.
- [[Direct Form II IIR Filter]] – compares: commutes the two halves so the delay lines merge, and pays for it by widening every $b_i$ multiplier.
- [[Transposed Direct Form I IIR Filter]] – extends: transposition turns the SOPC into an MCM and the adder chain into structural adders.
- [[Direct-Form FIR Filter]] – counter-example: delete the $a_i$ and $\langle\!\langle\mathcal H_\delta\rangle\!\rangle$ collapses to 1, so the guard-bit formula returns a single bit.
- [[Biquad Cascade]] – extends: the well-conditioned way to reach high order, built from second-order sections of exactly this shape.
- [[Choosing a Filter Structure]] – compares: where this sits against every sibling at equal guaranteed accuracy.
- [[Sums of Weighted Bits]] – supports: why the SOPC should be one heap with one rounding rather than $n+m+1$ rounded products.
- [[Rounding]] – supports: faithfulness, and the $2^{\ell'-1}$ cost of the final round-to-nearest.
- [[FloPoCo]] – supports: `FixIIR` computes a guaranteed overestimate of $\langle\!\langle\mathcal H_\delta\rangle\!\rangle$, then emits the architecture and its worst-case test bench.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.5.2, pp. 678-680 — recursive filters, (23.15), direct form I and its transpose (Fig. 23.9), direct form II and delay sharing (Figs. 23.10, 23.11).
- §23.1.6, p. 681 — why the $b_i$ multipliers are cheaper in direct form I than in direct form II, and the critical-path drawback of the transposed direct form II.
- §23.3.1-23.3.2, pp. 689-691 — worst-case peak gain (Defs. 23.4, 23.5, Eqs. 23.20-23.23), the interface and (23.24), and the direct-form architecture with its fixed-point formats (Fig. 23.17).
- §23.3.3-23.3.5, pp. 691-694 — the error decomposition (23.25)-(23.30), the error filter $\mathcal H_\delta$ (23.31)-(23.34) and Fig. 23.19, the guard-bit formula (23.35)-(23.37), and the `FixIIR` bell-resonator example.
