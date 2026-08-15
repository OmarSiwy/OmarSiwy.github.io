---
title: LNS Neuron
description: "Log-domain weights and activations: the multiply is an adder, an antilog table returns to fixed point for an exact sum, and one log(ReLU1) table closes the loop — good accuracy at 4 to 6 bits, at which point both tables are plain FPGA LUTs."
kind: circuit
source: "ASA §24.3.1.3, pp. 727-728"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, lns, logarithmic, table, fpga]
aliases:
  - ELMA Neuron
  - ELMA
  - Exact Log-Linear Multiply-Add
  - LNS Low-Precision Neuron
  - LNS Neurons
---

# LNS Neuron

A neuron whose weights *and* activations are stored as logarithms, so each product is an addition, but whose accumulation is done in linear fixed point through an antilog table — which is what makes the sum exact and leaves rounding only in the two conversions.

```tikz title="LNS neuron: log-domain products, linear-domain sum, one log(ReLU1) table"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=latex, font=\small]

  % ---- lanes -------------------------------------------------------------
  \foreach \x/\i in {0/1, 6/N} {
    \draw[->] (\x-0.55,5.95) -- (\x-0.55,5.4);
    \draw[->] (\x+0.35,5.95) -- (\x+0.35,5.4);
    \node[anchor=south] at (\x-0.55,5.98) {$L_{X_\i}$};
    \node[anchor=south] at (\x+0.35,5.98) {$L_{W_\i}$};

    % log-domain multiply = adder
    \draw (\x-1.0,4.8) rectangle (\x+0.9,5.4);
    \node at (\x-0.05,5.1) {$+$};

    % sign bit bypasses the adder
    \node[anchor=south] at (\x+1.45,5.98) {$s_{W_\i}$};
    \draw[->] (\x+1.45,5.9) -- (\x+1.45,3.75) -- (\x+0.9,3.75);

    % antilog table
    \draw[->] (\x-0.05,4.8) -- (\x-0.05,4.1);
    \draw (\x-1.0,3.4) rectangle (\x+0.9,4.1);
    \node at (\x-0.05,3.75) {$b^{-x}$};

    \draw[->] (\x-0.05,3.4) -- (\x-0.05,2.7);
  }
  \node at (3.0,3.75) {$\cdots$};

  % ---- exact fixed-point accumulator --------------------------------------
  \draw (-1.4,1.9) rectangle (7.3,2.7);
  \node at (3.0,2.3) {$\Sigma$};
  \draw[->] (-3.3,2.52) -- (-1.4,2.52);
  \node[anchor=east] at (-3.35,2.52) {bias $B$};
  \draw[->] (-3.3,2.08) -- (-1.4,2.08);
  \node[anchor=east] at (-3.35,2.08) {$S_\mathrm{in}$};
  \draw[->] (7.3,2.3) -- (9.1,2.3);
  \node[anchor=west] at (9.15,2.3) {$S_\mathrm{out}$};

  % ---- activation folded into one log table -------------------------------
  \draw[->] (3.0,1.9) -- (3.0,1.45);
  \draw (1.3,0.75) rectangle (4.7,1.45);
  \node at (3.0,1.1) {$\log_b\bigl(\mathrm{ReLU1}(x)\bigr)$};
  \draw[->] (3.0,0.75) -- (3.0,0.1);
  \node[anchor=north] at (3.0,0.05) {$L_{X'_j}$};

  % ---- widths (lane 1; every lane is identical) ---------------------------
  \node[anchor=east] at (-0.65,5.62) {\scriptsize ufix$(m,\ell)$};
  \node[anchor=east] at (-0.15,4.45) {\scriptsize ufix$(m{+}1,\ell)$};
  \node[anchor=east] at (-0.15,3.05) {\scriptsize sfix$(1,\ell')$};
  \node[anchor=west] at (3.15,1.67) {\scriptsize sfix$(m_S,\ell')$};
  \node[anchor=west] at (3.15,0.42) {\scriptsize ufix$(m,\ell)$};

\end{circuitikz}
\end{document}
```

*after Fig. 24.10, p. 728. `ufix(m, ℓ)` / `sfix(m, ℓ)` name the MSB and LSB weights $2^m$ and $2^\ell$, so the width is $m-\ell+1$ bits — see [[Fixed-Point Representations]].*

**Turn the multiply into an add, and pay for it at the sum.** The whole design rests on one identity, $\log_b(WX) = \log_b W + \log_b X$: put both operands of a product in the log domain and the multiplier is an $(m-\ell+1)$-bit adder. The bill arrives one operator later, because the neuron does not want a product, it wants $\sum_i W_i X_i$, and addition has no such identity. Adding in the log domain means evaluating $\log_b(b^u + b^v) = u + \log_b(1 + b^{\,v-u})$, the Gaussian logarithm — a max, a shift, a subtract and a nonlinear table on the difference $v-u$ ([[Logarithmic Number Systems]]). That is the Fig. 24.9e architecture, and it is *approximate*: every one of the $N-1$ accumulation steps rounds.

**ELMA's move: leave the log domain once per product, sum in fixed point, come back once per neuron.** The "somewhat inaccurately named" Exact Log-Linear Multiply-Add (p. 727) antilogs each product straight after the log-domain adder, then accumulates linearly. The name is defensible in the precise sense that *both* additions in the datapath — the log-domain add that forms the product and the linear-domain add that forms the sum — are exact fixed-point additions. The two roundings that remain are conversions, not accumulations: the $b^{-x}$ table on each lane and the $\log_b(\mathrm{ReLU1}(x))$ table at the output. Rounding error is therefore $O(1)$ in $N$ rather than $O(N)$, which is exactly the property a log-domain accumulator throws away. Because the summation is now a plain fixed-point sum, the layer-exactness rule of p. 726 applies unchanged: give the accumulator $q \ge p$ bits, plus $\lceil \log_2 N \rceil$ of headroom, and the sum is bit-exact.

**ReLU1 buys away both sign bits of the activation.** Clamping activations to $[0,1]$ — ReLU with an upper saturation at $1$, Fig. 24.3, p. 712 — is not an accuracy concession here, it is a format decision. Since $X \ge 0$ the activation needs no sign bit, and since $X \le 1$ its logarithm is always $\le 0$, so storing $L_X = \lfloor -\log_b|X| \rceil$ makes the *logarithm* unsigned too. Two bits saved out of a 4-to-6-bit word is a large fraction. Weights get only half the deal: $|W| < 1$ holds in practice, so $L_W = \lfloor -\log_b|W| \rceil$ is unsigned as well, but the weight's own sign $s_W$ survives as one bit that bypasses the adder and is applied where the antilog table produces a signed `sfix` value. Both $L_X$ and $L_W$ are $\mathrm{ufix}(m,\ell)$; their sum is $\mathrm{ufix}(m{+}1,\ell)$, one bit wider, and that extra bit is the entire cost of the "multiplier".

**Zero is encoded by underflow, not by a flag.** $\log_b 0$ is undefined, so LNS normally needs a special code and a comparator on every operand. The trick of p. 728 is to reserve the *largest* representable $L_X$ and then choose $\ell'$ — the antilog table's LSB weight — so that $b^{-L_\text{max}}$ rounds to $0$ anyway. Nothing special-cases anything: the zero code goes through the same adder and the same table and comes out as a fixed-point zero. Better, every $L_{W}+L_{X}$ *larger* than $L_\text{max}$ — which is what a multiplication by an encoded zero produces — is also below the table's rounding threshold, so the encoding is closed under the log-domain add for free.

**The base is a tuning knob, not a constant.** $b$ sets the ratio between consecutive representable magnitudes, so for a fixed word size it trades dynamic range against relative precision. Most of the literature takes $b = 2$ because the antilog of an integer log is then a shift, but once the log carries fractional bits the table is a table regardless of $b$, and $b$ becomes a free parameter to fit a given layer's weight distribution (p. 727).

**At 4 to 6 bits both tables are single LUTs, which is why this is an FPGA idea.** Good accuracy is reported for word sizes between 4 and 6 bits (p. 728). A $\mathrm{ufix}(m{+}1,\ell)$ index of $\le 6$ bits addressing a $\le 6$-bit output is exactly one 6-LUT per output bit on a modern FPGA — the antilog is not *approximated* by a table, it *is* a table, with no polynomial and no range reduction ([[Lookup-Tables]], [[Table-Based Function Evaluation]]). The output stage is better still: $\log_b$, ReLU1 and the requantisation to the next layer's format are one composed function of one variable, so the activation function costs nothing beyond the table that was needed anyway. On an ASIC the same tables become logic-minimised ROM and this argument weakens considerably — the LUT-equals-table coincidence is FPGA-specific, and it is what decides whether an LNS neuron beats an integer MAC ([[Quantized MAC Neuron]]).

$$\boxed{\ L_{X'_j} \;=\; \Bigl\lfloor -\log_b \operatorname{ReLU1}\Bigl(B + \sum_{i=1}^{N} (-1)^{s_{W_i}}\, b^{-\left(L_{W_i} + L_{X_i}\right)}\Bigr) \Bigr\rceil\ }$$

Every $b^{-(\cdot)}$ is one table lookup, every $+$ inside the parentheses is an exact fixed-point add, and the outer $\lfloor -\log_b \operatorname{ReLU1}(\cdot) \rceil$ is one more table.

**When it breaks.**

- **Above about 6 bits the LUT argument collapses.** A 7-bit index needs two LUT6s per output bit, an 8-bit index four, and the antilog table is replicated $N$ times — one per lane — so table area scales with $N$ while a linear MAC array shares one multiplier structure. There is a width beyond which the integer datapath simply wins.
- **The sum's width is not free.** The figure annotates the accumulator as $\mathrm{sfix}(2,\ell')$, one MSB above a single lane's $\mathrm{sfix}(1,\ell')$. That is enough only if the terms are known to cancel; a worst-case-exact sum of $N$ terms plus a bias needs $\lceil\log_2(N{+}1)\rceil$ MSBs of headroom by the rule of p. 726, which is what the RTL below uses.
- **Underflow is silent and asymmetric.** Small products vanish into the reserved-zero region while large ones are clamped by ReLU1. Neither is signalled, and neither is an ulp-style error you can bound with [[Error Accuracy]] — the relative error of an LNS magnitude is constant across its range, but once a term rounds to zero the error is the whole term.
- **This is an inference operator.** The log domain is where a *gradient*'s dynamic range would help most, but nothing here is differentiable through the tables, and the book's training discussion (p. 729) goes to FP8 instead.
- **It does not chain into a shared PE array cleanly.** $S_\text{in}/S_\text{out}$ chain partial sums between neurons, which suits an unrolled or stream datapath ([[Choosing a Deep Learning Datapath]]); a time-multiplexed systolic array would have to re-enter the log domain far more often than once per neuron.

**RTL.** Concrete instance: $b=2$, $\ell = -2$ so a log is $\mathrm{ufix}(2,-2)$ — five bits in quarter-ulp steps — and magnitudes are $\mathrm{ufix}(0,-5)$. Code $31$ is the reserved zero, and the antilog of every index $\ge 25$ is already $0$, so the reservation costs no comparator.

```spade
/// antilog: k = L_W + L_X in ufix(3,-2)  ->  2^(-k/4) in ufix(0,-5)
fn antilog(k: uint<6>) -> uint<6> {
    [32u6, 27, 23, 19, 16, 13, 11, 10, 8, 7, 6, 5, 4, 3, 3, 2,
      2,  2,  1,  1,  1,  1,  1,  1,  1, 0, 0, 0, 0, 0, 0, 0,
      0,  0,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0,
      0,  0,  0,  0,  0,  0,  0,  0,  0, 0, 0, 0, 0, 0, 0, 0][k]
}

/// log_b(ReLU1(x)): x in ufix(0,-5) already clamped to [0,1] -> L in ufix(2,-2)
fn log_relu1(x: uint<6>) -> uint<5> {
    [31u5, 20, 16, 14, 12, 11, 10,  9,  8,  7,  7,  6,  6,  5,  5,  4,
       4,  4,  3,  3,  3,  2,  2,  2,  2,  1,  1,  1,  1,  1,  0,  0,
       0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,
       0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0][x]
}

/// One lane: the log-domain "multiply" IS the adder; the antilog table
/// returns to signed fixed point. sfix(1,-5) = int<7>.
fn lns_lane(lx: uint<5>, lw: uint<5>, sw: bool) -> int<7> {
    let mag = antilog(lx + lw).to_int();
    if sw { -mag } else { mag }
}

/// Exact fixed-point sum of N lanes plus the bias. Accumulator sfix(4,-5)
/// = int<10> carries ceil(log2(N+1)) = 3 bits over a lane, so it cannot overflow.
fn lns_sum<#uint N>(lx: [uint<5>; N], lw: [uint<5>; N], sw: [bool; N], bias: int<7>) -> int<10> {
    gen if N == 0 {
        sext(bias)
    } else {
        let head: int<10> = sext(lns_lane(lx[0], lw[0], sw[0]));
        let tail: int<10> = lns_sum(lx[1..N], lw[1..N], sw[1..N], bias);
        head +. tail
    }
}

/// Whole neuron: N log-adds, N antilogs, one exact sum, one log(ReLU1) table.
fn lns_neuron<#uint N>(lx: [uint<5>; N], lw: [uint<5>; N], sw: [bool; N], bias: int<7>) -> uint<5> {
    let acc = lns_sum(lx, lw, sw, bias);
    let clamped: int<10> = if acc < 0 { 0 } else { if acc > 32 { 32 } else { acc } };
    log_relu1(trunc(clamped.as_uint()))
}
```

`lx + lw` is the diagram's `+` box and is the only arithmetic in the lane — `uint<5> + uint<5>` widens to `uint<6>`, which is the drawing's $\mathrm{ufix}(m,\ell) \to \mathrm{ufix}(m{+}1,\ell)$ growth. `antilog` and `log_relu1` are the $b^{-x}$ and $\log_b(\mathrm{ReLU1}(x))$ boxes; `to_int` is the $\mathrm{ufix}(0,-5) \to \mathrm{sfix}(1,-5)$ widening that makes room for $s_W$, which the unary minus then applies. Everything is combinational — the $S_\text{in}/S_\text{out}$ chain of the figure is where a register would go, between `lns_sum` and `log_relu1`. What synthesis does differently from the drawing: the two array literals never become memories, they are constant-folded into LUT masks, and `clamped` is not a subtractor but two comparators feeding a mux.

**Related Notes.**

- [[Logarithmic Number Systems]] – depends-on: the format this neuron stores its operands in, and the Gaussian-logarithm addition it goes out of its way to avoid.
- [[Log-Activation Shift Neuron]] – compares: the half-measure, log activations against linear weights, so the multiply is a shift and a leading-one detector converts back.
- [[Quantized MAC Neuron]] – compares: the linear-integer baseline; the crossover is where the antilog table stops fitting one LUT.
- [[Lookup-Tables]] – supports: at 4 to 6 bits the antilog and log are single FPGA LUTs, which is the whole cost argument.
- [[Table-Based Function Evaluation]] – extends: what to do with the same two functions once the word grows past a directly tabulable width.
- [[Fixed-Point Representations]] – depends-on: the `ufix`/`sfix` MSB-LSB notation and the exactness condition on the accumulator.
- [[ReLU Unit]] – counter-example: here the activation is never a separate block, it is absorbed into the output log table.
- [[Choosing a Deep Learning Datapath]] – compares: where a log-domain neuron sits against the integer and binary alternatives.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §24.3.1.3 "Logarithmic Formats", pp. 727–728 — ELMA, the ReLU1 sign-bit saving, the reserved zero code, the 4-to-6-bit LUT claim, Figs. 24.9 and 24.10.
- §24.3.1.1, p. 726 — the $p = m+n$ / $q \ge p$ exactness rule, reused here for the linear accumulator.
- §24.2, Fig. 24.3, p. 712 — ReLU1.
- §24.3.2, p. 729 — why training goes to FP8 rather than to LNS.
- §16, Fig. 16.11, p. 492 — the FPGA LUT the tables map onto.
