---
title: Additive Synthesis Filter Bank
description: "Parallel bank of biquads, each a decaying harmonic, gain-scaled and summed; legal because convolution distributes over addition, and it turns a physical bell model into hardware with per-mode WCPGs near 2e5."
kind: circuit
source: "ASA §23.1.7, p. 682; §23.1.4.3, pp. 674-675; §23.3.2, pp. 690-691; §23.3.5, p. 694"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, biquad, synthesis, fpga]
aliases:
  - Parallel Filter Bank
  - Parallel Biquad Bank
  - Additive Synthesis Filter Banks
  - Multimodal Additive Sound Synthesis
  - Parallel Decomposition Filter
---

# Additive Synthesis Filter Bank

A parallel bank of second-order resonators, each scaled by its own gain and summed, and the only IIR structure in which one section's rounding error reaches the output through a single constant instead of through every other section's feedback loop.

```tikz title="Additive synthesis filter bank: n parallel biquads, per-mode gain, one summation tree"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % input bus
  \draw[->] (-2.3,1.9) -- (-1.15,1.9);
  \node[anchor=south, font=\tiny] at (-1.75,1.98) {$x(k)$};
  \node[anchor=north, font=\tiny] at (-1.75,1.82) {sfix$(0,\ell)$};
  \draw (-1.15,0.6) -- (-1.15,3.2);

  % --- mode 1 ---
  \fill (-1.15,3.2) circle (0.05);
  \draw[->] (-1.15,3.2) -- (0,3.2);
  \draw[fill=black!5] (0,2.92) rectangle (1.7,3.48);
  \node[font=\small] at (0.85,3.2) {biquad$_1$};
  \draw[->] (1.7,3.2) -- (2.6,3.2);
  \node[anchor=south, font=\tiny] at (2.15,3.28) {$y_1(k)$};
  \draw (2.6,3.48) -- (2.6,2.92) -- (3.2,3.2) -- cycle;
  \node[font=\tiny] at (2.82,3.2) {$g_1$};
  \draw[->] (3.2,3.2) -- (4.35,3.2);
  \node[anchor=south, font=\tiny] at (3.78,3.28) {$t_1(k)$};

  % --- mode 2 ---
  \fill (-1.15,1.9) circle (0.05);
  \draw[->] (-1.15,1.9) -- (0,1.9);
  \draw[fill=black!5] (0,1.62) rectangle (1.7,2.18);
  \node[font=\small] at (0.85,1.9) {biquad$_2$};
  \draw[->] (1.7,1.9) -- (2.6,1.9);
  \node[anchor=south, font=\tiny] at (2.15,1.98) {$y_2(k)$};
  \draw (2.6,2.18) -- (2.6,1.62) -- (3.2,1.9) -- cycle;
  \node[font=\tiny] at (2.82,1.9) {$g_2$};
  \draw[->] (3.2,1.9) -- (4.35,1.9);
  \node[anchor=south, font=\tiny] at (3.78,1.98) {$t_2(k)$};

  % --- vertical ellipsis ---
  \node[font=\small] at (0.85,1.32) {$\vdots$};
  \node[font=\small] at (3.78,1.32) {$\vdots$};

  % --- mode n ---
  \fill (-1.15,0.6) circle (0.05);
  \draw[->] (-1.15,0.6) -- (0,0.6);
  \draw[fill=black!5] (0,0.32) rectangle (1.7,0.88);
  \node[font=\small] at (0.85,0.6) {biquad$_n$};
  \draw[->] (1.7,0.6) -- (2.6,0.6);
  \node[anchor=south, font=\tiny] at (2.15,0.68) {$y_n(k)$};
  \draw (2.6,0.88) -- (2.6,0.32) -- (3.2,0.6) -- cycle;
  \node[font=\tiny] at (2.82,0.6) {$g_n$};
  \draw[->] (3.2,0.6) -- (4.35,0.6);
  \node[anchor=south, font=\tiny] at (3.78,0.68) {$t_n(k)$};

  % --- summation tree ---
  \draw[fill=black!5] (4.35,0.2) rectangle (5.05,3.6);
  \node[font=\large] at (4.70,1.9) {$\Sigma$};
  \draw[->] (5.05,1.9) -- (6.5,1.9);
  \node[anchor=south, font=\tiny] at (5.80,1.98) {$o(k)$};
  \node[anchor=north, font=\tiny] at (5.80,1.82) {sfix$(m',\ell')$};

  % --- format annotations ---
  \node[anchor=west, font=\tiny] at (-2.3,4.0) {every $y_i$, $t_i$: sfix$(m',\ell_{\mathrm{ext}})$ --- one shared internal format};
  \node[anchor=west, font=\tiny] at (-2.3,-0.25) {$\Sigma$ carries $\lceil\log_2 n\rceil$ extra MSBs internally, then one final round};
\end{circuitikz}
\end{document}
```

*after Fig. 23.12, p. 682, with the formats of Fig. 23.17, p. 690.*

**Skip the frequency-design step entirely.** Almost every filter in this chapter arrives as a frequency mask and has to be pushed through the three-step FD → Q → I flow of p. 685. This one does not. In physics-based multimodal additive sound synthesis the sound of a struck bell is *modelled* as a weighted sum of decaying harmonics; harmonic $i$ carries exactly two physical parameters, its frequency $f_i$ and its 60 dB decay time $T_i^{60}$, plus a gain $g_i$, and all three fall out of a mechanical model of the object. A closed-form map (Smith, E.7) turns $(f_i, T_i^{60})$ into the $a_i, b_i$ of a second-order IIR (p. 682). There is no Remez, no bilinear transform, no design-space search — the FD step is replaced by physics, and only quantisation and implementation remain.

**The decomposition is legal because convolution distributes over addition.** The bank realises $h=\sum_i g_i h_i$, and by distributivity of $\circledast$ over $+$ — which follows from the convolution sum by exchanging two finite summations (p. 674) — the parallel structure and the single merged filter compute the same signal:

$$o = h\circledast x=\Big(\textstyle\sum_i g_ih_i\Big)\circledast x=\sum_i g_i\,(h_i\circledast x)=\sum_i g_i\,y_i$$

This is exactly the *parallel combination* identity of Fig. 23.5, p. 675, read right to left. Note what it licenses and what it does not: the two sides are equal as **LTI filters**, over real signals. Actual rounded addition and multiplication are not linear, so the merged $2n$-th-order section and the bank of $n$ biquads give different numbers in hardware (p. 675). The identity is a licence to *choose* a structure, never a licence to assume two structures agree bit for bit.

**Each mode is a resonator whose poles sit a hair inside the unit circle, and that is the whole engineering problem.** Take the lowest mode of the book's bell model: $a_1=-1.99510896$, $a_2=0.999985754$, with numerator $b=(1,0,-1)$ (p. 694). Multiplying the denominator $1+a_1z^{-1}+a_2z^{-2}$ of (23.19) by $z^2$ gives the characteristic polynomial $z^2+a_1z+a_2$, so by **Vieta's formulas** the product of its roots is $a_2$ and their sum is $-a_1$. The roots are a conjugate pair $re^{\pm j\theta}$, hence

$$r=\sqrt{a_2}=0.99999288,\qquad \cos\theta=\frac{-a_1}{2r}\;\Longrightarrow\;\theta=0.069848\ \text{rad}$$

so the mode rings at $f=\theta f_s/2\pi=0.011117\,f_s$ — 490 Hz at $f_s=44.1$ kHz — and decays as $r^k$, giving $T^{60}=\ln(10^{-3})/(f_s\ln r)=22.0$ s. A pole radius of $1-7\times10^{-6}$ *is* a 22-second decay; the two statements are the same statement.

**A near-unit-circle pole has an enormous worst-case peak gain, and the WCPG prices the MSB.** FloPoCo computes $\langle\!\langle\mathcal{H}\rangle\!\rangle=178\,750$ for that single mode (p. 694). Feeding it into the output-MSB bound (23.24), with the input normalised to $\overline{u}=1$ so that the input format is `sfix(0, ℓ)`,

$$m'\le\left\lceil\log_2\!\left(\langle\!\langle\mathcal{H}\rangle\!\rangle+2^{\ell'}\right)\right\rceil=\lceil 17.45\rceil=18$$

Eighteen integer bits, for a filter whose input never exceeds one. But the adversarial signal of (23.21) that achieves this gain is a $\pm1$ sequence locked to the resonance for tens of seconds, and the actual excitation of a bell is a hammer: a sequence of *distant impulses*. For a unit impulse the output of this mode never exceeds 2 in absolute value (p. 694), so $m'=2$ suffices in the application. Those sixteen wasted bits would sit in every register, adder and multiplier of every mode, which is why `FixIIR` exposes an override of the application-specific WCPG rather than always trusting (23.24).

**The LSB is priced by a different WCPG — that of the error filter.** Rounding errors injected into the loop are themselves filtered by $\mathcal{H}_\delta(z)=1/(1+\sum_i a_iz^{-i})$, and (23.37) fixes the internal LSB at $\ell_{\text{ext}}=\ell'-1-\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$. For the same mode $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.2806\times10^6$, so $\lceil\log_2\rceil=21$ and the internal format runs **22 guard bits below the output LSB**. Guard bits are cheap — they widen a carry chain, not a multiplier array — which is exactly the point of building each mode body as one bit heap; see [[SOPC, Sum of Products by Constants]] and [[Error Accuracy]] for the ulp bookkeeping.

**Faithfulness does not survive the summation for free: the bank needs $\lceil\log_2 n\rceil$ more bits than any one mode.** Definition 23.3 bounds each mode's deviation from its ideal by strictly less than one ulp. Summing $n$ of them, the triangle inequality gives a bank error of up to $n$ ulp, which is not faithful. To make the *bank* faithful, each mode must be built to $1/n$ ulp — its $\ell_{\text{ext}}$ pushed down by $\lceil\log_2 n\rceil$ — and the summation tree must carry those bits and round **once**, at the bottom:

$$\ell_{\text{ext}}=\ell'-1-\lceil\log_2 n\rceil-\max_i\big\lceil\log_2\langle\!\langle\mathcal{H}_{\delta,i}\rangle\!\rangle\big\rceil$$

That $\lceil\log_2 n\rceil$ term is this note's composition of (23.37) with the $n$-way sum, not a formula from the book. The same triangle inequality bounds the bank's own WCPG from its modes: since $h=\sum_i g_ih_i$,

$$\langle\!\langle\mathcal{H}\rangle\!\rangle=\sum_k\Big|\sum_i g_ih_i(k)\Big|\le\sum_i|g_i|\,\langle\!\langle\mathcal{H}_i\rangle\!\rangle$$

so the output MSB is set by the loudest sharp mode and the bound degrades only linearly in $n$ — a mode you did not want costs one term, never a factor.

**What the parallel form buys over the series one is error independence.** In a [[Biquad Cascade]] the rounding error injected by section $j$ is fed through sections $j+1\ldots n$, so it is amplified by the product of their worst-case peak gains; with per-section WCPGs of $10^5$ that product is catastrophic, and the cascade must be ordered and scaled section by section to control it. In the bank, mode $i$'s error passes through exactly one constant multiplier $g_i$ and lands in the adder tree. Error contributions **add** here and **multiply** there. The same independence shows up structurally: retuning one partial changes one biquad's two coefficients and nothing else, and the combinational depth is one biquad plus $\lceil\log_2 n\rceil$ adder levels regardless of $n$, against $n$ biquads deep for an unregistered cascade.

**FPGA mapping: the numerator is free and the modes are embarrassingly parallel.** With $b=(1,0,-1)$ the forward path is $x(k)-x(k-2)$ — two registers and one subtract, **no multiplier at all**, because $\pm1$ is not a constant multiplication. Each mode therefore costs exactly two constant multiplications, by $a_1$ and by $a_2$, plus the gain $g_i$; at the ~20-bit coefficient widths derived below each maps to a DSP block, or to a shift-and-add tree from [[Multiplication by Constants]] if the DSP columns are wanted elsewhere. The modes share no data, so $n$ of them place and route independently and the only global structure is the [[Adders]] tree at the output. The reverse trade is available too: audio rates are absurdly low next to fabric clocks — 4166 cycles per sample at 200 MHz and $f_s=48$ kHz — so one physical biquad time-multiplexed over a coefficient RAM covers hundreds of modes, trading the adder tree for an accumulator. On an ASIC without hard multipliers that time-multiplexed form is usually the only sensible one.

$$\boxed{\ o(k)=\sum_{i=1}^{n}g_i\,(h_i\circledast x)(k),\qquad \langle\!\langle\mathcal{H}\rangle\!\rangle\le\sum_{i=1}^{n}|g_i|\,\langle\!\langle\mathcal{H}_i\rangle\!\rangle,\qquad \ell_{\text{ext}}=\ell'-1-\lceil\log_2 n\rceil-\max_i\lceil\log_2\langle\!\langle\mathcal{H}_{\delta,i}\rangle\!\rangle\ }$$

**When it breaks**

- **Coefficient width, not signal width, is what kills this structure.** $1-a_2=1.4246\times10^{-5}$ for the bell's lowest mode, so a coefficient format with fewer than 17 fractional bits rounds $a_2$ to exactly $1$: the pole lands *on* the unit circle and the mode becomes a perpetual oscillator that never decays. Worse, $T^{60}\approx-2\ln(10^{-3})/\big(f_s(1-a_2)\big)$, so a relative error in $1-a_2$ is a relative error in the decay time one-for-one: at 17 fractional bits one ulp of $a_2$ is $0.54$ of $1-a_2$ and the bell's decay is wrong by more than 50%. Roughly 20 fractional bits are needed before $T^{60}$ is right to a few percent. No amount of $\ell_{\text{ext}}$ repairs this — guard bits fix the datapath, not the quantised poles.
- **Distributivity is an identity on ideal filters only.** Merging two modes into one fourth-order section, or reassociating the adder tree, changes the rounded result. Two "mathematically equivalent" banks are not bit-equivalent.
- **Small $n$ has no story.** At $n\le3$ the $\lceil\log_2 n\rceil$ guard bits, the $2n$ state registers and the adder tree buy nothing that a single [[Direct Form II IIR Filter]] of order $2n$ does not already do more cheaply. The structure earns its keep at tens of modes.
- **Heavily damped or real-pole modes do not need a section.** A partial whose $T^{60}$ is a few samples contributes an impulse-like $h_i$; folding it into the numerator of a neighbour is cheaper than giving it a feedback loop and 22 guard bits.
- **The WCPG bound is the guarantee, not the behaviour.** Sizing the bank from (23.24) is always safe and here always absurd. Every deployment of this structure overrides $m'$ from the impulse response, which means the faithfulness guarantee of Definition 23.3 is being traded for an application-level argument about the excitation. That trade is deliberate; make it explicitly.

**RTL (Spade)**

```spade
// Q14 constant multiply: 24-bit signal, 24-bit coefficient, result back in 24 bits.
fn qmul(c: int<24>, v: int<24>) -> int<24> {
    trunc((c * v) >>> 14)
}

// One resonant mode: second-order IIR, transposed direct form II.
entity mode(clk: clock, rst: bool, x: int<24>,
            b0: int<24>, b1: int<24>, b2: int<24>,
            a1: int<24>, a2: int<24>) -> int<24> {
    decl y, s2;
    reg(clk) s1: int<24> reset(rst: 0) = qmul(b1, x) -. qmul(a1, y) +. s2;
    reg(clk) s2: int<24> reset(rst: 0) = qmul(b2, x) -. qmul(a2, y);
    let y: int<24> = qmul(b0, x) +. s1;
    y
}

// Three-mode additive-synthesis bank: parallel modes, per-mode gain, one sum.
entity bank3(clk: clock, rst: bool, x: int<24>) -> int<24> {
    let y1 = inst mode(clk, rst, x, 16384, 0, -16384, -32688, 16383);
    let y2 = inst mode(clk, rst, x, 16384, 0, -16384, -30000, 16300);
    let y3 = inst mode(clk, rst, x, 16384, 0, -16384, -20000, 16200);
    qmul(8192, y1) +. qmul(4096, y2) +. qmul(2048, y3)
}
```

`x` is the input bus of the diagram, each `mode` a `biquad` block, each `y` an arrow into a gain triangle, and the tail expression is the whole $\Sigma$ box. Only `s1` and `s2` are registered — two state words per mode, so the bank holds $2n$ registers and no shared delay line, which is exactly why the modes are independent. Widths: `c * v` is `int<48>` by Spade's doubling rule, `>>> 14` restores the Q14 scale and `trunc` drops back to `int<24>`, and every add uses the wrapping `+.`/`-.` because fixed-point evaluation modulo $2^{m'}$ is harmless when the final result is in range (p. 691) — the guard bits argued for above are the $\ell_{\text{ext}}$ this Q14 toy does *not* have. Synthesis will differ from the drawing in one place: the three gains and the two coefficients per mode are constants, so the tools will replace each `qmul` with shift-and-add or a DSP primitive rather than the general multiplier the source implies.

Verified with `spade 0.19.0` and simulated against a behavioural reference through `.zettel/sim.sh`: 3047 vectors — a hammer impulse followed by 40 cycles of free ringing, the asymmetric pairs $1\to128$ and $128\to1$, and a 3000-vector random sweep — all matching, all with non-zero output.

**Related Notes**

- [[Biquad Section]] – depends-on: every block in the bank is one of these, its two coefficients derived from $f_i$ and $T_i^{60}$.
- [[Biquad Cascade]] – compares: the same second-order unit wired in series, where a section's error is amplified by every downstream WCPG instead of by one gain.
- [[Transposed Direct Form II IIR Filter]] – depends-on: the internal structure used for each mode in the RTL above, chosen for its shared delay line and short forward path.
- [[Direct Form II IIR Filter]] – counter-example: at small $n$ a single higher-order direct form beats the bank outright.
- [[SOPC, Sum of Products by Constants]] – supports: each mode body is one bit heap, compressed once and rounded once, which is what makes $\ell_{\text{ext}}$ cheap.
- [[Multiplication by Constants]] – supports: the $g_i$, $a_1$ and $a_2$ are compile-time constants, so every multiplier here is a shift-and-add candidate.
- [[Adders]] – supports: the $\Sigma$ box is an adder tree $\lceil\log_2 n\rceil$ levels deep, carrying the extra guard bits.
- [[Choosing a Filter Structure]] – compares: where the parallel bank sits against every other structure in this folder.
- [[Error Accuracy]] – depends-on: the faithfulness definition and the ulp arithmetic the $\lceil\log_2 n\rceil$ term is built on.
- [[Number Formats]] – depends-on: the `sfix(m, ℓ)` notation used for every signal above.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
- §23.1.4.3 *Convolutions and Filter Structures*, pp. 674–675 — distributivity of convolution over addition, Fig. 23.5 (parallel decomposition), and the warning that the identity fails under rounding.
- §23.1.7 *Filters Directly Defined by Their Coefficients*, p. 682 — multimodal additive sound synthesis, Fig. 23.12 (the bank), $f_i$/$T_i^{60}$/$g_i$ from a physical model.
- §23.3.2 *Interface Considerations*, pp. 690–691 — the $\overline{u}=1$ normalisation and `sfix(0, ℓ)` input, the output-MSB bound (23.24), the bell WCPG near $2\times10^5$ and why $m'$ should instead come from the impulse response, and the modulo-$2^{m'}$ argument for internal overflow.
- §23.3.5 *Putting All Together*, p. 694 — (23.37) for $\ell_{\text{ext}}$, and the *Hands on: FixIIR* box with $a_1=-1.99510896$, $a_2=0.999985754$, $\langle\!\langle\mathcal{H}\rangle\!\rangle=178\,750$ and $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.2806\times10^6$.
