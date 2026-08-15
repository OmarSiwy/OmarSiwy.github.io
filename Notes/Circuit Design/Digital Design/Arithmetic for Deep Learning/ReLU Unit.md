---
title: ReLU Unit
description: "Sign test plus multiplexer: the activation function that costs nothing, kills the vanishing-gradient problem, and whose piecewise linearity is what legalises free choice of scaling factors everywhere else in the datapath."
kind: circuit
source: "ASA §24.1.2, §24.3.1, pp. 712-713, 725-727"
status: seed
spade: simulated
tags: [digital, deep-learning, activation, quantization, fpga]
aliases:
  - ReLU
  - Rectified Linear Unit
  - Leaky ReLU
  - ReLU1
---

# ReLU Unit

$f(Y)=\max(0,Y)$ implemented as a sign test driving a mask — the only common activation function whose entire hardware cost is one inverter and a row of AND gates, and the only one whose *positive homogeneity* makes every fixed-point scaling factor in the layer free.

```tikz title="ReLU transfer curve and the AND-mask datapath fused with the output requantiser"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % ---- (a) transfer curve ----
  \draw[->] (-1.5,0) -- (1.7,0) node[anchor=west] {$Y$};
  \draw[->] (0,-0.5) -- (0,1.9) node[anchor=south] {$f(Y)$};
  \draw[very thick] (-1.4,0) -- (0,0) -- (1.5,1.5);
  \node[anchor=north] at (-0.75,-0.08) {$Y<0$};
  \node[anchor=north] at (0.8,-0.08) {$Y\ge 0$};
  \node[anchor=north] at (0.1,-0.8) {\emph{(a) $f(Y)=\max(0,Y)$}};

  % ---- (b) fused datapath ----
  \begin{scope}[xshift=8.2cm]
    \node[and port, scale=0.75] (ag) at (0.7,0.5) {};
    \node[not port, scale=0.75] (nt) at (-1.0,2.0) {};

    % accumulator bus into the AND bank
    \draw[->] (-3.2,0.3) -- (ag.in 2);
    \node[anchor=north] at (-2.1,0.2) {$Y$ [$q$], two's complement};

    % sign-bit tap, inverted, into the other AND input
    \draw (-2.1,0.3) -- (-2.1,2.0) -- (nt.in);
    \node[anchor=east] at (-2.15,1.35) {$Y_{q-1}$ (sign)};
    \draw (nt.out) -- ++(0.25,0) |- (ag.in 1);

    % masked, now non-negative
    \draw[->] (ag.out) -- (3.0,0.5);
    \node[anchor=north] at (1.7,0.3) {[$q-1$] unsigned};
    \node[anchor=north] at (0.7,-0.6) {$q-1$ such slices};

    % rescale
    \draw (3.0,0.0) rectangle (4.2,1.0);
    \node at (3.6,0.5) {$\gg s$};
    \draw[->] (4.2,0.5) -- (5.0,0.5);

    % round + saturate
    \draw (5.0,0.0) rectangle (6.8,1.0);
    \node[align=center] at (5.9,0.5) {round \&\\saturate};
    \draw[->] (6.8,0.5) -- (8.2,0.5);
    \node[anchor=north] at (7.5,0.35) {$X'$ [$n'$]};

    \node[anchor=north] at (2.5,-1.3) {\emph{(b) ReLU fused with the output requantiser}};
  \end{scope}
\end{circuitikz}
\end{document}
```

*Panel (a) after Fig. 24.3c, p. 712; panel (b) is my own construction from the width rules of p. 726.*

**Collapse the nonlinearity onto a single bit.** The neuron of [[Quantized MAC Neuron]] delivers a weighted sum $Y$ on $q$ bits in two's complement, $q \ge p + \lceil\log_2 N\rceil$ with $p = m+n$ the exact product width for $m$-bit activations and $n$-bit weights (p. 726). Everything a nonlinearity can know about the sign of $Y$ is already sitting in the top bit: by the two's-complement definition $Y = -2^{q-1}Y_{q-1} + \sum_{i<q-1} 2^i Y_i$, the term $-2^{q-1}Y_{q-1}$ dominates the rest of the sum in magnitude, so $Y < 0 \iff Y_{q-1} = 1$. See [[Number Formats]] for why that inequality is exact rather than approximate. So

$$\max(0,Y) \;=\; \begin{cases} Y & Y_{q-1}=0\\ 0 & Y_{q-1}=1\end{cases}$$

which is literally a $q$-bit 2:1 [[Multiplexers|multiplexer]] with a hardwired zero on one leg.

**Kill the multiplexer with the annihilator law.** Write the mux bit-slice in sum-of-products form, $X_i = (\overline{Y_{q-1}} \wedge Y_i) \vee (Y_{q-1} \wedge 0)$. The second product term vanishes by the annihilator law $x \wedge 0 = 0$, and the surviving term absorbs the disjunction by the identity $x \vee 0 = x$. What is left is one AND gate per bit:

$$X_i \;=\; Y_i \wedge \overline{Y_{q-1}}, \qquad i = 0,\dots,q-2$$

$q-1$ AND2 gates and one inverter, one gate delay, no carry propagation of any kind. The slice $i = q-1$ is not built at all: its value is $Y_{q-1} \wedge \overline{Y_{q-1}} = 0$ by complementation, so the result is a **$(q-1)$-bit unsigned** number and ReLU has silently paid for itself by deleting the sign bit. Every sibling activation of Fig. 24.3 needs a table or a polynomial ([[Polynomial Approximation]]) to get its first output bit; ReLU needs a wire.

**Fuse it into the requantiser so the incremental cost is exactly zero.** $Y$ is deliberately wider than anything stored — its extra bits never leave the operator, so they cost no memory traffic (p. 726) — and the layer boundary demands an $n'$-bit activation. That conversion is an arithmetic right shift by $s$, a round, and a clamp, which is [[Requantization Unit]]. Because ReLU already guarantees a non-negative operand, the shift downstream of it is *logical*, not arithmetic: no sign extension network, and the round-to-nearest constant $2^{s-1}$ can never push the value below zero, so the clamp is one-sided. Ordering ReLU first is therefore strictly cheaper than requantising first, and the book makes the same point from the other direction — "the quantization to the output format is also easy to integrate in the ReLU operation" (p. 726). On an FPGA the fusion is total: the mask input is a free extra input to the 6-LUT that the rounder already occupies ([[FPGAs]]), so the ReLU bank consumes **no additional LUTs**. On an ASIC it is $q-1$ AND2 cells, amortised over the $N$ multipliers and the whole compressor tree that feed it, which is why p. 726 calls its contribution to cost "very small".

> [!important]
> ReLU is *positively homogeneous*: for any $\lambda > 0$, multiplication by $\lambda$ is a strictly increasing map and therefore commutes with $\max$, giving $\max(0,\lambda Y) = \lambda\max(0,Y)$. Every operation before the activation is linear, so a rescaling of the weights or activations of a trained layer passes straight through the nonlinearity and can be compensated in the next layer with the network function unchanged (p. 713). **This is what makes the position of the binary point irrelevant** — the scaling factors "are irrelevant here" and "fixed-point formats can trivially be reduced to integers" (p. 726). The per-layer shared exponent of [[Quantization]] is legal for exactly the same reason. A sigmoid or $\tanh$ table has no such property: rescale its input and the table must be regenerated.

**Account for the error it introduces: none.** ReLU is a *selection*, not a computation — it emits either an input bit or a constant, so it is bit-exact with respect to the quantized network, just as the exact products and the non-overflowing accumulator before it are (p. 726). The whole error budget of the layer sits in the single rounding of the requantise step; inside the operator the result is $0$ ulp, and outside it there is no ulp specification at all, only the top-$n$ accuracy of the trained network. That is the boundary at which [[Error Accuracy]] stops applying.

**Buy the variants with the cheapest arithmetic that expresses them.** Leaky ReLU, $f(Y)=\max(0,Y)+\alpha\min(0,Y)$, replaces the constant-zero mux leg with $\alpha Y$, so it costs one constant multiplier on the negative branch — see [[Multiplication by Constants]]; choosing $\alpha = 2^{-k}$ degenerates that to a hardwired right shift and keeps the whole unit gate-free. The special case $\alpha = -1$ is absolute-value rectification (p. 713), i.e. a conditional negate: XOR the $q$ bits with the replicated sign and add it back in, by the two's-complement identity $-Y = \overline{Y}+1$. ReLU1 clamps to $[0,1]$ and needs a second comparison against the constant $1$, a [[Magnitude Comparator]] degenerated to a constant operand; in exchange the activation range is known *a priori*, so the output format needs neither a sign bit nor a range analysis (p. 713) — which is precisely the trick that makes [[LNS Neuron|LNS activations]] representable at all, since $X \le 1$ forces $\log_b X \le 0$ and the log needs no sign bit either (p. 727).

$$\boxed{\ \mathrm{ReLU}(Y)_i = Y_i \wedge \overline{Y_{q-1}}\ \ (i<q-1), \qquad \mathrm{ReLU}(\lambda Y) = \lambda\,\mathrm{ReLU}(Y)\ \ \forall\lambda>0\ }$$

**When it breaks.**

- **Non-two's-complement $Y$.** The mask identity is a statement about two's complement. In sign-magnitude or binary32 the same one-line trick still works (AND every bit with $\overline{s}$ yields $+0$), but in a logarithmic format there is no bit pattern for zero at all, so the clamp needs a reserved code — the largest representable $L_X$ standing in for $0$ (p. 728). See [[LNS Neuron]].
- **An accumulator that is one bit too narrow.** If $q < p + \lceil\log_2 N\rceil$ the sum can wrap, and ReLU then reads the wrapped sign bit as authoritative. A positive overflow that wraps negative is silently flushed to $0$, and a negative one that wraps positive is passed through as a large plausible activation. Without the ReLU, an overflow shows up as an obviously wrong sign; with it, the failure is invisible. The width rule is load-bearing, not a comfort margin.
- **Training, not inference.** The gradient is exactly $0$ for $Y<0$, so a unit driven negative by every input stops learning permanently. Leaky ReLU and GELU exist to fix this, and pay for it in hardware ($\operatorname{erf}$ for GELU). See [[Choosing a Deep Learning Datapath]].
- **The asymptotics never arrive.** There is one activation per $N$ multiply-accumulates, so ReLU's share of layer cost is $O(q/(Nmn))$. Optimising this circuit is pointless at every width that occurs in practice; the only reason to think about it is the fusion with requantisation, which is a *format* decision, not a gate-count one.
- **Output layers.** ReLU is monotone but unbounded and does not normalise, so the classifier head still needs [[Softmax Unit]] — or, at inference only, [[Argmax Unit]].

**RTL (Spade).**

```spade
/// ReLU on a q-bit two's-complement accumulator: max(0, Y).
fn relu<#uint Q>(y: int<Q>) -> uint<Q> {
    if y.sign_bit() { 0 } else { y.as_uint() }
}

/// Fused ReLU + requantise: clamp below at 0, rescale by 2^-S, saturate to N bits.
fn relu_requant<#uint Q, #uint N, #uint S>(y: int<Q>) -> uint<N> {
    let r: uint<Q> = relu::<Q>(y) >> S;
    let zero: uint<N> = 0;
    if (r >> N) != 0 { ~zero } else { trunc(r) }
}
```

`y.sign_bit()` is the tap on $Y_{q-1}$ in the drawing and `as_uint` is a pure reinterpretation, so `relu` is one $q$-wide mux against a constant — synthesis will fold it into the AND bank of panel (b) by the annihilator law, exactly as derived, and will not emit a mux. It is purely combinational; the pipeline register belongs to the requantiser, not here. `relu::<Q>` returns `uint<Q>` rather than `uint<Q-1>` because Spade's `trunc` would need the top bit proven zero — the bit is constant-`0` in the netlist and is optimised away, so the drawing's $q-1$ and the code's $Q$ describe the same silicon. The shift in `relu_requant` is logical (`>>` on `uint`) precisely because ReLU ran first, and `(r >> N) != 0` is the one-sided overflow test that a signed requantiser would have to do twice.

**Related notes.**

- [[Quantized MAC Neuron]] – depends-on: produces the $q$-bit two's-complement $Y$ this reads the sign of.
- [[Requantization Unit]] – extends: the shift/round/saturate stage ReLU fuses into, and the only place the layer rounds.
- [[Combinational Logic]] – supports: the mux-to-AND reduction is the annihilator law applied to a multiplexer bit-slice.
- [[Magnitude Comparator]] – compares: $\max(0,Y)$ is a comparison against a constant collapsed to one bit; ReLU1 needs the real thing at the top end.
- [[Multiplication by Constants]] – extends: the $\alpha$ of leaky ReLU, free when $\alpha$ is a power of two.
- [[Max Pooling Unit]] – compares: the layer's other $\max$, where both operands vary and a comparator tree is unavoidable.
- [[LNS Neuron]] – counter-example: in the log domain the clamp's output value has no encoding, so the "free" activation needs a reserved code.
- [[Choosing a Deep Learning Datapath]] – compares: where this sits against every sibling activation function.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §24.1.2 "Activation Functions", pp. 712-713 (Fig. 24.3; leaky ReLU, GELU, ReLU1; the piecewise-linearity/rescaling argument).
- Ibid., §24.3.1 "Fixed-Point Formats for Inference", pp. 725-726 (Fig. 24.9; scaling factors irrelevant because everything before ReLU is linear and ReLU is piecewise linear; $p=m+n$, $q\ge p$; ReLU's cost negligible; quantization folded into the ReLU).
- Ibid., §24.3.1.3 "Logarithmic Formats", pp. 727-728 (ReLU1 as the enabler for unsigned log activations; the missing zero encoding).
- Long-form note: [[6.2) Arithmetic for Deep Learning]], §Neural network overview and §Quantization.
