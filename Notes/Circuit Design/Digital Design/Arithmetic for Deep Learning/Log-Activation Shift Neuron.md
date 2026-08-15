---
title: "Log-Activation Shift Neuron"
description: "Keep weights linear and activations logarithmic and the multiplier degenerates to a barrel shifter, with a leading-one detector re-encoding the ReLU output back into the log domain."
kind: circuit
source: "ASA §24.3.1.3, pp. 725-728"
status: seed
spade: simulated
tags: [digital, arithmetic-for-deep-learning, lns, shifter, quantization]
aliases:
  - Log-Activation Neuron
  - Shift-Multiplier Neuron
  - Integer Log Activations
---

# Log-Activation Shift Neuron

A neuron that log-encodes only *one* of its two operands — activations as integer base-2 logarithms, weights as ordinary fixed point — so the per-tap multiplier collapses to a barrel shifter while the accumulation stays an exact fixed-point sum.

```tikz title="Log-activation neuron: shifter as multiplier, LOD as the return path to the log domain"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- one tap: weight stays linear, activation arrives as an exponent ----
  \draw[->] (-0.2,2.30) -- (1.5,2.30);
  \node[anchor=south] at (0.65,2.34) {$W_0$ [$n$]};
  \draw[->] (-0.2,1.30) -- (1.5,1.30);
  \node[anchor=north] at (0.65,1.26) {$L_0$ [$m$]};

  \draw (1.5,1.00) rectangle (2.9,2.60);
  \node at (2.20,1.80) {$\ll$};
  \node[anchor=south] at (2.20,2.62) {barrel shifter};

  \draw[->] (2.9,1.80) -- (4.6,1.80);
  \node[anchor=south] at (3.75,1.84) {$P_0$ [$n{+}E$]};

  % ---- the other N-1 taps, same structure ----
  \draw[dotted,thick] (2.20,0.95) -- (2.20,0.15);
  \draw[->,dotted,thick] (2.9,0.55) -- (4.6,0.55);
  \node[anchor=north] at (3.60,0.51) {$P_1 \dots P_{N-1}$};

  % ---- exact fixed-point accumulation ----
  \draw (4.6,0.05) rectangle (6.1,2.60);
  \node at (5.35,1.50) {$\Sigma$};
  \draw[->] (5.35,-0.75) -- (5.35,0.05);
  \node[anchor=west] at (5.40,-0.45) {bias $B$ [$n{+}E$]};

  \draw[->] (6.1,1.80) -- (7.3,1.80);
  \node[anchor=south] at (6.70,1.84) {$Y$ [$q$]};

  % ---- ReLU, then back to the log domain ----
  \draw (7.3,1.20) rectangle (8.7,2.40);
  \node at (8.00,1.80) {ReLU};
  \draw[->] (8.7,1.80) -- (9.9,1.80);
  \node[anchor=south] at (9.30,1.84) {[$q$]};

  \draw (9.9,1.20) rectangle (11.3,2.40);
  \node at (10.60,1.80) {LOD};
  \draw[->] (11.3,1.80) -- (12.9,1.80);
  \node[anchor=south] at (12.10,1.84) {$L_{X'}$ [$m'$]};
  \node[anchor=north,align=center] at (10.60,1.16)
       {$\lfloor\log_2\rfloor$\\by leading-one position};
\end{circuitikz}
\end{document}
```

*after Fig. 24.9 (d), p. 725, with the width rules of p. 726.*

**Break the symmetry between the two operands.** The obvious move in a log-domain datapath is to encode everything logarithmically, which is what Figs. 24.9(e) and (f) do. This architecture deliberately does not. Only the activation is logarithmic: with base $b=2$ and integer $L_X$, an activation is $X = 2^{-L_X}$ *exactly*, so by the law of exponents

$$W \cdot X \;=\; W \cdot 2^{-L_X}$$

is a pure change of binade — the same bit pattern of $W$ moved to different weights. There are no partial products to generate and none to compress. The weight stays an $n$-bit two's-complement integer, which means the accumulation stays a plain fixed-point sum. That asymmetry is the entire trick: it deletes the multiplier without importing the addition problem of [[Logarithmic Number Systems]], where $\log(u+v)$ has no closed form and needs an approximation table.

**Turn the shift into an alignment, so the product is exact.** Taken literally, $W \gg L_X$ discards the $L_X$ low bits of $W$ and the product is no longer exact. The repair is a constant rescaling of the whole layer by $2^{E}$ with $E = \max L_X$, which costs nothing because every operation before the activation function is linear and ReLU is positively homogeneous — any consistent scaling passes straight through and is absorbed by the next layer's chosen format ([[Quantization]]). What the hardware then computes per tap is

$$P_i \;=\; W_i \cdot 2^{\,E - L_i}, \qquad 0 \le E - L_i \le E,$$

a **left** shift by a non-negative distance, which is why Fig. 24.9(d) draws $\ll$ and not $\gg$. Widths: $W_i$ signed on $n$ bits, $L_i$ unsigned on $m$ bits so $E = 2^m - 1$, and $P_i$ signed on $n + E$ bits with **zero ulp of error** — the same "products are exact" rule the linear datapath gets from $p = m + n$ (p. 726), reached here by a different route. The block itself is an $m$-stage [[Barrel Shifters|barrel shifter]] over an $(n+E)$-bit field.

**The accumulator obeys the same $q \ge p$ rule, but $p$ has grown exponentially.** Summing $N$ taps plus the bias needs

$$q \;\ge\; n + E + \lceil \log_2 (N{+}1) \rceil$$

for the sum to be exact, exactly as in the all-linear neuron. The difference is that $E = 2^m - 1$ is *exponential* in the activation word size, not linear in it. At $m = 3$, $E = 7$; at $m = 4$, $E = 15$; at $m = 6$, $E = 63$, which pushes $q$ past seventy bits for 8-bit weights. This is the arithmetic reason behind the book's flat statement that logarithmic encodings give good accuracy for word sizes of **4 to 6 bits** (p. 728) and are not pursued beyond that.

> [!important] The multiplier's area does not disappear, it migrates. An $n \times n$ multiplier is traded for an $m$-stage shifter *plus* an adder tree that is $E$ bits wider than the linear one. The trade only wins while $E$ is small, and $E$ doubles with every bit added to the activation.

**The return path to the log domain is a leading-one detector, and that is the second saving.** Re-encoding $Y$ as a logarithm means computing $\lfloor \log_2 Y \rfloor$, and in a binary positional system that quantity is *already present in the encoding*: it is the index of $Y$'s most significant set bit. Writing $\operatorname{lzc}$ for the leading-zero count of a $q$-bit word ([[Leading Zero Counters]]),

$$L_{X'} \;=\; (q-1) - \operatorname{lzc}(Y).$$

This is the same block a floating-point [[Normalizers|normaliser]] uses to find its renormalisation distance, with the shift thrown away and only the count kept. No table, no polynomial, no multiplier — contrast the fully logarithmic neuron of Fig. 24.10, which pays for a $b^{-x}$ antilog table on the way in *and* a $\log_b(\mathrm{ReLU1}(x))$ table on the way out.

**Putting ReLU before the LOD makes the output logarithm unsigned and does the requantisation at the same time.** ReLU forces $Y \ge 0$, so the leading-one index is defined for every non-zero output and $L_{X'}$ needs no sign bit — the p. 727 observation that a ReLU1-bounded activation has $X \in [0,1]$, hence $\log_2 X \le 0$, hence a sign-free unsigned magnitude. And because the LOD discards everything below the leading one, ReLU and LOD together *are* the requantiser: the word leaving the neuron shrinks from $q$ bits to $m' = \lceil \log_2 q \rceil$ bits in one combinational block, with no rounding constant, no shifter and no clamp comparator. Compare the [[Requantization Unit]] a linear datapath needs at the same boundary.

**All of the error lives in that truncation, and it is one-sided.** $\lfloor \log_2 \rfloor$ never rounds up, so every activation leaving this neuron is under-estimated by up to a full binade — a relative error approaching a factor of $2$, and, unlike a linear requantiser's round-off, a *bias* rather than a zero-mean perturbation. Round-to-nearest in the log domain means comparing $Y$ against the geometric midpoint $2^{k+1/2} \approx 1.414 \cdot 2^{k}$ rather than the arithmetic one; the cheap approximation is to inspect the single bit below the leading one, which rounds at $1.5 \cdot 2^{k}$ and costs one OR into the increment.

> [!warning] The book quotes the 4-to-6-bit accuracy figure for the *format*, not for a particular LOD rounding mode, and does not evaluate the bias that plain truncation injects layer after layer. Not covered in the source — needs outside research.

**On FPGA the cost comparison inverts.** On ASIC the trade is unambiguous: an $n \times n$ multiplier is $O(n^2)$ cells while an $m$-stage barrel shifter over $n+E$ bits is $O\big(m(n+E)\big)$ 2:1 muxes, and for the small $m$ this format is useful at, the shifter wins outright. On an FPGA the multiplier is not built from fabric at all — it is a hard DSP block, effectively free until the last one is spent — whereas the shifter and the wider accumulator both consume LUTs and carry chain ([[FPGAs]]). A 6-input LUT implements a 4:1 mux, so each LUT level absorbs two shift stages and the shifter alone costs about $\lceil m/2 \rceil (n+E)$ LUTs. Shift-based neurons therefore pay off on FPGA when DSP blocks are the binding resource, and cost you when LUTs are.

$$\boxed{\;Y=\sum_{i=0}^{N-1} W_i\,2^{\,E-L_i} + B, \qquad L_{X'} = (q-1)-\operatorname{lzc}\!\big(\mathrm{ReLU}(Y)\big)\;}$$

with $E = 2^m - 1$ and $q \ge n + E + \lceil\log_2(N{+}1)\rceil$.

**Where it stops paying.**

- **Zero has no logarithm, at both ends.** On the input side $L_X$ must reserve a code; the standard choice is the *largest* representable $L_X$, with the format picked so that $2^{-L_{\max}}$ would round to zero anyway (p. 728). On the output side $\mathrm{ReLU}(Y)=0$ has no leading one at all, so the LOD result is meaningless and a separate zero flag has to force the reserved code — the third output of the RTL below.
- **Above roughly six bits of activation** the exponential $E = 2^m-1$ makes the shifter, the accumulator and the adder tree all larger than the multiplier they replaced. The asymptotics that motivate the circuit stop holding inside the range where the format is useful.
- **The scheme rests on ReLU.** Give $X$ a sign and the shifter needs a signed pre-inversion, the output logarithm regains its sign bit, and both savings shrink.
- **Truncation bias compounds across layers**, so post-training quantization is not enough — this format expects quantization-aware training.
- **Once both operands go logarithmic** the shifter becomes an adder but the sum needs an antilog table or an approximation, and this note stops applying: [[LNS Neuron]]. Push the other way, to $\pm 1$ weights and activations, and the multiplier vanishes even more cheaply: [[XNOR-Popcount Neuron]].

**RTL.**

```spade
fn popcount<#uint N>(x: [bool; N]) -> uint<N> {
    gen if N == 1 {
        x[0].as_uint()
    } else {
        let head: uint<N> = zext(x[0].as_uint());
        let tail: uint<N> = zext(popcount(x[1..N]));
        trunc(head + tail)
    }
}

/// align W_i by its activation exponent: P_i = W_i * 2^(E - L_i), exact in n+E = 15 bits
fn align(w: int<8>, l: uint<3>) -> int<15> {
    let wide: int<15> = sext(w);
    let sh: int<15> = sext((7 - l).as_int());
    wide << sh
}

/// leading-one detector: index of the most significant set bit (meaningless when y == 0)
fn lod17(y: uint<17>) -> uint<5> {
    let s1:  uint<17> = y  | (y  >> 1);
    let s2:  uint<17> = s1 | (s1 >> 2);
    let s4:  uint<17> = s2 | (s2 >> 4);
    let s8:  uint<17> = s4 | (s4 >> 8);
    let s16: uint<17> = s8 | (s8 >> 16);
    let n: uint<17> = popcount(s16.as_bits());
    let m: uint<5> = trunc(n);
    m -. 1
}

entity log_shift_neuron4(
    w0: int<8>, w1: int<8>, w2: int<8>, w3: int<8>,
    l0: uint<3>, l1: uint<3>, l2: uint<3>, l3: uint<3>,
) -> (int<17>, uint<5>, bool) {
    let a: int<17> = trunc(sext::<15,17>(align(w0, l0)) + sext::<15,17>(align(w1, l1)));
    let b: int<17> = trunc(sext::<15,17>(align(w2, l2)) + sext::<15,17>(align(w3, l3)));
    let y: int<17> = trunc(a + b);
    let r: int<17> = if y < 0 { 0 } else { y };
    (r, lod17(r.as_uint()), r == 0)
}
```

Concrete instance of the diagram at $n=8$, $m=3$, $N=4$: `align` is the barrel shifter, its `7 - l` being the $E - L_i$ distance with $E = 2^3-1 = 7$, and its `int<15>` result being the exact $P_i$ at $n+E$ bits. The three adds are $\Sigma$ at $q = 15 + \lceil\log_2 4\rceil = 17$ bits, so nothing overflows and nothing rounds; the bias is simply one more sign-extended addend and is omitted here. `lod17` smears the leading one rightward and counts — the `-. 1` wraps to `31` when the input is zero, which is exactly why the zero flag is a separate output rather than an inferred condition. The whole entity is combinational (no `reg`); synthesis will not build the smear-and-popcount literally, it will map it onto the tree-structured priority encoder of [[Leading Zero Counters]], which is smaller — this form is written to express the *definition* of $\lfloor\log_2\rfloor$ rather than its cheapest gate netlist.

Verified by simulation: 3010 vectors, including the asymmetric $1\cdot 2^{7} + 1\cdot 2^{0} = 129$ case and its tap-swapped twin (both bit order and tap order are visible in it), a single weight walked through the whole exponent range, negative sums clamped by ReLU, exact cancellation to zero, full-scale positive and negative saturation, and a 3000-vector random sweep against a behavioural reference in Verilog. Zero failures.

**Related notes.**

- [[Barrel Shifters]] – depends-on: the shifter this neuron substitutes for its multiplier, and the source of the $O(m(n+E))$ mux count.
- [[Leading Zero Counters]] – depends-on: the LOD on the return path is an LZC with the shift discarded and the count kept.
- [[Normalizers]] – compares: same count-then-shift structure, used for the opposite purpose — a normaliser keeps the shift and throws the count into an exponent field.
- [[Logarithmic Number Systems]] – depends-on: the encoding $X = b^{-L_X}$, and the addition problem this architecture sidesteps by only log-encoding one operand.
- [[LNS Neuron]] – extends: pushes both operands into the log domain, turning the shifter into an adder at the price of two conversion tables.
- [[Quantized MAC Neuron]] – compares: the all-linear baseline, where the same $q \ge p$ exactness rule costs a real multiplier.
- [[Requantization Unit]] – counter-example: the linear datapath needs an explicit rounder and clamp at the layer boundary; here ReLU and the LOD do that job as a side effect.
- [[Choosing a Deep Learning Datapath]] – compares: where this sits against every sibling in the chapter.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, Springer 2024.
  - §24.3.1, Fig. 24.9 (d) — "Integer log activations, linear weights", p. 725.
  - §24.3.1.1 "Fixed-Point Formats for Inference", p. 726 — product exactness and the $q \ge p$ accumulator rule.
  - §24.3.1.3 "Logarithmic Formats", p. 727 — multipliers as bit shifts, base $b$ as a free parameter, the ReLU1 sign-free logarithm.
  - §24.3.1.3, p. 728 — zero encoding by the largest representable $L_X$, and the 4-to-6-bit accuracy range; Fig. 24.10 for the fully logarithmic sibling.
