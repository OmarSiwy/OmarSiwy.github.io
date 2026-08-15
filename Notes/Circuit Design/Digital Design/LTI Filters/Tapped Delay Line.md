---
title: Tapped Delay Line
description: "Shift register whose every stage is broken out as a tap; the memory that separates a filter from a stateless function evaluator, at one register per sample of history."
kind: circuit
source: "ASA §23.1.5, pp. 676-677"
status: seed
spade: simulated
tags: [digital, lti-filters, registers, fir, delay]
aliases:
  - Tapped Delay Lines
  - Delay Line
  - Shift Register Delay Line
  - TDL
  - Register Chain
---

# Tapped Delay Line

A cascade of $N$ unit-delay registers with every intermediate node exposed, so that tap $i$ carries $u(k-i)$ and the whole history window a filter needs is available in one cycle, without any addressing logic.

```tikz title="Tapped delay line of order 4: clocked register chain with all five taps broken out, each W bits wide"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % clock distribution
  \draw[->] (-1.6,3.1) -- (6.9,3.1);
  \node[anchor=south, font=\tiny] at (-1.25,3.16) {$clk$};
  \foreach \x in {0.9,2.7,4.5,6.3} {
    \draw[->] (\x,3.1) -- (\x,2.3);
    \fill (\x,3.1) circle (0.045);
  }

  % the delay line itself
  \draw[->] (-1.6,2.0) -- (7.5,2.0);
  \node[anchor=south, font=\tiny] at (-1.15,2.06) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.15,1.94) {$W$};
  \foreach \x in {0.9,2.7,4.5,6.3} {
    \draw[fill=black!10] (\x-0.16,1.72) rectangle (\x+0.16,2.28);
    \node[font=\tiny] at (\x,2.0) {$\mathcal{D}$};
  }

  % tap points
  \foreach \x in {0,1.8,3.6,5.4,7.2} {
    \fill (\x,2.0) circle (0.055);
    \draw[->] (\x,2.0) -- (\x,1.05);
  }

  % tap labels
  \node[anchor=north, font=\tiny] at (0,0.99) {$u(k)$};
  \node[anchor=north, font=\tiny] at (1.8,0.99) {$u(k{-}1)$};
  \node[anchor=north, font=\tiny] at (3.6,0.99) {$u(k{-}2)$};
  \node[anchor=north, font=\tiny] at (5.4,0.99) {$u(k{-}3)$};
  \node[anchor=north, font=\tiny] at (7.2,0.99) {$u(k{-}4)$};
  \foreach \x in {0,1.8,3.6,5.4,7.2}
    \node[anchor=north, font=\tiny] at (\x,0.63) {$W$};

  % what the taps feed
  \draw[dashed] (-0.6,0.28) rectangle (7.8,-0.32);
  \node[font=\tiny] at (3.6,-0.02) {tap consumers: $b_0\ldots b_4$ (SOPC), or a correlator, or a FIFO read port};

  % register count annotation
  \node[anchor=west, font=\tiny] at (-0.6,-0.72) {$N=4$ registers $\Rightarrow$ $N{+}1=5$ taps, $N\cdot W$ flip-flops, tap $0$ purely combinational};
\end{circuitikz}
\end{document}
```

*after Fig. 23.6c and Fig. 23.7, pp. 676-677.*

**Isolate the one stateful primitive.** A filter structure is built from exactly three abstract components — addition, multiplication by a constant, and the unit delay $\mathcal{D}$ — and each is itself an elementary LTI filter (Fig. 23.6, p. 676). The first two are stateless combinational functions of the current cycle. $\mathcal{D}$ is the only one that carries anything across a clock edge, and therefore the only one that distinguishes a filter from the stateless function evaluators of [[Fixed-Point Function Approximation]]: a filter eats one sample per cycle and *carries memory* (p. 671). The tapped delay line is what you get when you keep the delay and throw the other two away — the pure memory substrate, priced separately from the arithmetic it feeds.

**Turn the convolution's index arithmetic into wiring.** The non-recursive difference equation

$$y(k)=\sum_{i=0}^{n}b_i\,u(k-i),\qquad b_i=h(i) \tag{23.14}$$

needs $n+1$ *different* samples of $u$ available simultaneously in cycle $k$. Written as software this is an indexed read of a circular buffer, and the index arithmetic $k-i \bmod (n{+}1)$ costs an adder and a multiplexer per access. In hardware the shift makes the arithmetic disappear: by definition of the shift operator $\mathcal{D}^n(u)=\{u(k-n)\}$, cascading $i$ unit delays gives $\mathcal{D}^i$, so **spatial position along the chain *is* the index $i$**. Tap $i$ is a fixed wire, not an address, and the chain's cost is one register per unit of history rather than one memory port per tap.

**Read the whole structure in the $z$ domain.** The $z$-transform maps $\mathcal{D}^n$ to multiplication by $z^{-n}$ (p. 683) — which is the reason the delay box is drawn $\boxed{z^{-1}}$ in most texts — so composing delays becomes multiplying monomials, $z^{-1}\cdot z^{-1}=z^{-2}$, by associativity of multiplication in $\mathbb{C}[z^{-1}]$. The tap vector is therefore $\left(U(z),\,z^{-1}U(z),\ldots,z^{-N}U(z)\right)$, and every FIR structure in this topic is one linear combination of that vector with a different bracketing.

**State every width, and note that the delay line never changes one.** Take the topic's normalised interface: input `sfix(0, ℓ)` with $\overline{u}=1$, so the MSB sits at position $0$ and the word is $W = 1-\ell$ bits ($\ell=-7 \Rightarrow W=8$). Every tap is the same $W$ bits, because $\mathcal{D}$ is a *permutation of the sample sequence in time* and touches no bit. Compare the siblings: $a+b$ on two $W$-bit words is $W+1$ bits, and a multiplication by a nontrivial constant has strictly more output bits than input bits — which is exactly why rounding is compulsory inside a recursive loop (p. 687). Widths and formats grow at the adders and multipliers; along the delay line they are constant. The line holds $N\cdot W$ flip-flops and no combinational logic at all, so its contribution to the critical path is zero and to $\delta_{\text{r}}$ of (23.30) is *exactly* zero. See [[Fixed-Point Representations]] for the format notation and [[Error Accuracy]] for what $\delta_{\text{r}}$ is measured against.

> [!important] The delay is the only one of the three primitives that is exact in finite precision
> $\mathcal{L}\cap\mathcal{C}$ — stable LTI filters that are also implementable as hardware digital filters — is nearly empty precisely because adders and constant multipliers must round (p. 687). The delay line is the part of a filter that survives quantisation untouched: a bit that goes into a register comes out of it. So every guard bit derived by (23.37) is bought for the *arithmetic*, and paying it makes the delay line proportionally more expensive without making it more accurate. This is the whole reason register count and multiplier width are separate axes when comparing structures.

**Where the line sits decides how wide it has to be.** All four direct forms contain one or two of these chains, but at different formats, and that is the real cost difference between them:

- **Direct form I** (p. 679) has *two* unshared lines — one on $u$, one on $\widetilde{y}$ — of $n$ and $m$ stages. The $u$-line is at the narrow input width $W$; the $\widetilde{y}$-line is at the internal `sfix(m', ℓ_ext)`.
- **Direct form II** (p. 680) commutes the two halves — legal by **commutativity of convolution** — so both lines hold the same values $t'(k)$ and collapse into one chain of $\max(n,m)$ stages. Registers halve, but the surviving line lives *inside the loop*, so every stage is at extended precision `sfix(m', ℓ_ext)` and every $b_i$ multiplier now sees a wide operand instead of a narrow one. Halving the register count while widening each register is not automatically a win.
- **Transposed forms** (p. 678) have no tapped delay line at all. Transposition reverses every wire and swaps forks with adders, so the registers end up *between the structural adders*, at product width, and no single wire carries $u(k-i)$ anywhere in the circuit. If your note-level intuition is "a FIR filter contains a shift register", the transposed form is the counter-example.

**Cost is linear and the tap count is what makes it unavoidable.** $N\cdot W$ flip-flops, $N\cdot W$ D-inputs of fan-out one, and one clock net; the only combinational path is the input node's fan-out to tap 0 and to the first register's D input. Because each stage's output feeds exactly two loads (the next stage and its own tap consumer), fan-out is $O(1)$ per node regardless of $N$ — unlike the transposed FIR, where the single input $u(k)$ must reach all $n+1$ constant multipliers and needs a buffer tree. See [[Synchronous Sequential Logic]] for the setup/hold reasoning that makes the chain safe at any depth, and [[Barrel Shifters]] for the contrast: a barrel shifter moves data across *bit* positions combinationally in one cycle, a delay line moves it across *time* positions one stage per cycle.

> [!warning] FPGA mapping is not covered in the source
> Chapter 23 does not map filters onto FPGA primitives; it defers all constant multiplication to Ch. 12 and says nothing about registers. Outside the book, the relevant fact is that a LUT can be reconfigured as a small addressable shift register (Xilinx SRL16/SRL32, and the equivalent on other vendors), which turns a *deep untapped* delay into roughly one LUT per bit per shift-register depth instead of one flip-flop per bit per stage. A *tapped* line cannot use this directly, because every intermediate node must be visible and an SRL exposes only its addressed output — so a tapped line is either flip-flops throughout, or one SRL segment per inter-tap span. See [[FPGAs]] and [[Block Memory]]; the exact depth/LUT ratios are vendor-specific and not stated here.

$$\boxed{\ t_i(k)=u(k-i)=\mathcal{D}^i(u)(k),\qquad T_i(z)=z^{-i}U(z),\qquad i=0,\ldots,N\ }$$

with cost $N$ registers of $W$ bits, $N+1$ taps, zero combinational depth, and zero contribution to the rounding error.

**When it breaks.**

- **Deep line, few taps.** The flip-flop count is linear in $N$ whether or not you use the intermediate values. A 1024-stage delay with three taps should be three LUT-based shift registers or a [[Block Memory]] circular buffer with three read ports, not 1024 flip-flops.
- **Sparse or multirate coefficients.** Interpolated and sparse FIR filters have $b_i=0$ for most $i$; the registers spanning the zeros are pure cost and no tap is broken out of them, which is the case where a plain shift register beats a *tapped* one.
- **Startup.** The first $N$ outputs are computed from stages that hold reset values, not signal, so the structure has an $N$-cycle transient that the mathematics — which sums over $i\in\mathbb{Z}$ — does not model. A reset is not optional if downstream logic must not see that transient.
- **One sample per cycle is an assumption.** Time-shared, folded or bit-serial implementations compute one output over several cycles (p. 677); then the history is held in an addressed memory and the "no addressing logic" advantage disappears entirely.
- **Recursive placement.** In a loop the line stores $\widetilde{y}$, not $u$, so its width follows $\ell_{\text{ext}}=\ell'-1-\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$ (23.37). For a filter with $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\approx1.28\times10^6$ that is 22 extra bits *per stage* — the register cost of an IIR delay line is set by the error analysis, not by the sample width.

```spade
entity tapped_delay_line<#uint W, #uint N>(
    clk: clock,
    rst: bool,
    u: uint<W>,
) -> [uint<W>; {N + 1}] {
    reg(clk) line: [uint<W>; N] reset(rst: [0; N]) = line.shift_front(u);
    line.push_front(u)
}
```

`line` is the chain of $N$ shaded boxes in the diagram: `shift_front` pushes the new sample in at index 0 and drops the oldest, so `line[i]` is $u(k-1-i)$, one full clock behind the input. `push_front(u)` prepends the *unregistered* input, widening the result to `[uint<W>; {N+1}]` so that `taps[i]` is exactly $u(k-i)$ for all $i$ including $i=0$ — tap 0 is a wire, not a register, which is why $N$ registers give $N+1$ taps. Every element is the same `uint<W>`; the entity is purely registered with no combinational logic between stages, so the emitted Verilog is one packed `N*W`-bit vector with element 0 in the **least significant** position. Synthesis will not keep it as one vector: it will retime and possibly absorb untapped spans into shift-register LUTs, which is exactly the FPGA transformation the drawing cannot show.

Verified with `entity tdl8_4(clk, rst, u: uint<8>) -> [uint<8>; 5]` instantiating `tapped_delay_line::<8, 4>`, simulated against a behavioural Verilog shift register: 15 040 tap comparisons over 3 008 cycles, including the asymmetric named sequence $1, 128, 3, 200, 0, 255, 17, 0$ (which fails under either tap-order reversal or element-packing reversal) plus a 3 000-sample random sweep.

**Related Notes**

- [[Direct-Form FIR Filter]] – extends: adds one constant multiplier per tap and an adder chain, making this line's taps the operands of (23.14).
- [[SOPC, Sum of Products by Constants]] – supports: the block that consumes all $N+1$ taps as one bit heap, rounded once at the bottom.
- [[Transposed Direct-Form FIR Filter]] – counter-example: transposition destroys the line, leaving registers between structural adders and no wire carrying $u(k-i)$.
- [[Direct Form I IIR Filter]] – extends: two of these chains, one on $u$ at input width and one on $\widetilde{y}$ at extended width.
- [[Direct Form II IIR Filter]] – compares: commuting the halves merges both chains into one, halving registers but widening every stage.
- [[Choosing a Filter Structure]] – compares: register count per structure, against multiplier width and critical path.
- [[Synchronous Sequential Logic]] – depends-on: the timing discipline that makes an arbitrarily deep chain safe at one stage per edge.
- [[Barrel Shifters]] – compares: shifting across bit positions in one cycle versus across time positions one stage per cycle.
- [[Fixed-Point Representations]] – depends-on: the `sfix(m, ℓ)` notation that fixes $W=1-\ell$ on every tap.
- [[FPGAs]] – compares: LUT-based shift registers make an untapped delay far cheaper than $N\cdot W$ flip-flops.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.2, p. 671 — the shift operator $\mathcal{D}^n$, and memory as the one structural difference between a filter and a function evaluator.
- §23.1.5, pp. 676-677 — difference equation (23.13); the three abstract components (Fig. 23.6); direct-form non-recursive filter and its register chain (Fig. 23.7); parallel versus time-shared implementation.
- §23.1.5.1-23.1.5.2, pp. 678-680 — transposition and the loss of the tapped line (Fig. 23.8); direct form I and its two unshared lines (Fig. 23.9a); direct form II and the shared line (Figs. 23.10, 23.11a).
- §23.1.7, p. 683 — the $z$-transform mapping $\mathcal{D}^n$ to $z^{-n}$.
- §23.2, p. 687 — $\mathcal{L}\cap\mathcal{C}$ and why multipliers, not delays, force rounding.
- §23.3.2, pp. 690-691 — the `sfix(0, ℓ)` input format and the internal `sfix(m', ℓ_ext)`.
- §23.3.5, p. 694 — the guard-bit formula (23.37) and the $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.28\times10^6$ bell resonator.
