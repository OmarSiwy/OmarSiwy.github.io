---
title: Quadratic Series Divider
description: "Same quadratic convergence as Newton-Raphson but the squarer and the multiplier run in parallel instead of in sequence — shorter step, and the E datapath shrinks each iteration instead of growing."
kind: circuit
source: "ASA §9.4, pp. 295-299"
status: seed
spade: simulated
tags: [digital, divider, reciprocal, series, iterative, fpga]
aliases:
  - Quadratic Series Expansion
  - Division Using Quadratic Series Expansion
  - Series Expansion Divider
---

# Quadratic Series Divider

A reciprocal-based divider that expands $1/D$ as a product of doubling correction factors, so that each step's squarer and multiplier depend on the previous step's outputs but not on each other — the one multiplicative method whose critical path is one multiplier, not two.

```tikz title="One iteration of the quadratic series divider: squarer and multiplier in parallel"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[font=\small]
  % --- inputs ---
  \node at (0.6,6.5) {$Q_i$};
  \node at (6.4,6.5) {$E_i$};

  % --- blocks ---
  \node[draw,minimum size=0.6cm] (tq) at (2.4,4.9) {T};
  \node[draw,minimum size=0.6cm] (te) at (6.4,4.9) {T};
  \node[draw,minimum width=1.4cm,minimum height=0.8cm] (mul) at (2.9,3.3) {$\times$};
  \node[draw,minimum width=1.4cm,minimum height=0.8cm] (sqr) at (6.4,3.3) {$x^2$};
  \node[draw,minimum width=2.9cm,minimum height=0.8cm] (add) at (1.75,1.7) {$+$};

  % --- Q_i fan-out ---
  \draw (0.6,6.25) -- (0.6,5.7);
  \node[circ] at (0.6,5.7) {};
  \draw[->] (0.6,5.7) -- (0.6,2.1);
  \draw[->] (0.6,5.7) -- (2.4,5.7) -- (2.4,5.2);

  % --- E_i fan-out ---
  \draw (6.4,6.25) -- (6.4,5.7);
  \node[circ] at (6.4,5.7) {};
  \draw[->] (6.4,5.7) -- (6.4,5.2);
  \draw[->] (6.4,5.7) -- (3.4,5.7) -- (3.4,3.7);

  % --- truncated feeds ---
  \draw[->] (2.4,4.6) -- (2.4,3.7);
  \draw[->] (6.4,4.6) -- (6.4,3.7);

  % --- products ---
  \draw[->] (2.9,2.9) -- (2.9,2.1);
  \draw[->] (1.75,1.3) -- (1.75,0.75);
  \draw[->] (6.4,2.9) -- (6.4,0.75);

  % --- outputs ---
  \node at (1.75,0.5) {$Q_{i+1}$};
  \node at (6.4,0.5) {$E_{i+1}$};

  % --- formats ---
  \node[anchor=west,font=\tiny] at (0.7,4.6) {$\mathrm{ufix}(0,\ell)$};
  \node[anchor=east,font=\tiny] at (2.3,4.15) {$\widetilde Q_i:\ \mathrm{ufix}(0,\ell''_i)$};
  \node[anchor=west,font=\tiny] at (6.5,5.45) {$\mathrm{ufix}(m_i,\ell-1)$ (both branches)};
  \node[anchor=west,font=\tiny] at (6.5,4.15) {$\widetilde E_i:\ \mathrm{ufix}(m_i,\ell'_i)$};
  \node[anchor=west,font=\tiny] at (3.0,2.5) {$P_i:\ \mathrm{ufix}(m_i+1,\ell)$};
  \node[anchor=west,font=\tiny] at (1.85,1.0) {$\mathrm{ufix}(0,\ell)$};
  \node[anchor=west,font=\tiny] at (6.5,1.6) {$\mathrm{ufix}(m_{i+1},\ell-1)$};
\end{circuitikz}
\end{document}
```

*after Fig. 9.17b, p. 296.*

**Regroup the geometric series so each factor doubles the correct bits.** Start from a seed reciprocal $R_0 \approx 1/D$ and its remainder $e_0 = 1 - R_0D$ (the same $e_0$ as in [[Newton-Raphson Reciprocal]], produced by the same [[Reciprocal Seed Table]]). Then $R_0D = 1 - e_0$, so $1/D = R_0/(1-e_0)$, and the geometric series $\sum_{n\ge 0}x^n = 1/(1-x)$ — convergent because $|e_0| < 1$ by construction of the seed — gives

$$\frac1D = R_0(1 + e_0 + e_0^2 + e_0^3 + \cdots) = R_0(1+e_0)(1+e_0^2)(1+e_0^4)\cdots \tag{9.64--9.66}$$

The second equality is the binary regrouping: expanding the product picks out each exponent $n$ exactly once, because every natural number has exactly one decomposition into distinct powers of two. Truncating at $n$ factors therefore captures every term up to $e_0^{2^n-1}$, so the *number of correct bits doubles per factor* — quadratic convergence, expressed as a product instead of as a fixed point.

**Fold $X$ in at the seed and the quotient falls out without a final multiply.** Multiplying the whole product by $X$ and naming the running partial products $q_i$ and $e_i$:

$$q_0 = XR_0, \qquad q_{i+1} = q_i(1+e_i), \qquad e_{i+1} = e_i^2 \tag{9.71--9.75}$$

$X$ is multiplied by the *short* $R_0$ — a table output of $|\ell_0|$ bits, not a full significand — so the $X$ multiplication that [[Division by Reciprocal]] pays for at the end is absorbed into initialisation and effectively disappears (p. 295).

**The two recurrences are independent, and that is the whole architectural point.** $e_{i+1}$ needs only $e_i$; $q_{i+1}$ needs $q_i$ and $e_i$. Neither needs the other's result. So the squarer and the multiplier in the diagram issue *in the same step*, and one iteration costs one multiplier delay. Newton-Raphson's $r_{i+1} = 2r_i - Dr_i^2$ admits no such factorisation: the square must complete before the multiply starts, so its step is two multiplier delays. Same iteration count, half the critical path.

**Replace $1+E_i$ by an addition, unless the multiplier is a fixed-width block.** Since $E_i < 2^{m_i} \ll 1$, the number $1 + E_i$ has a long run of known zeros between its leading one and $E_i$'s MSB, and a multiplier that computes with them is burning area on nothing. Rewrite by distributivity of multiplication over addition, $Q_i(1+E_i) = Q_i + Q_iE_i$, and size the multiplier for the short $E_i$ only; the final fixed-point addition is exact (p. 297). The rewrite loses on a target with a *fixed-width* multiplier — a [[DSP Blocks|DSP block]] wide enough to take $1+E_i$ costs the same either way, so there $Q_i(1+E_i)$ is preferable and saves the adder.

**The $E$ datapath shrinks, because squaring doubles the leading run of zeros.** If $E_0 < 2^{m_0}$ then, ignoring rounding, $E_1 < 2^{2m_0}$ and $E_2 < 2^{4m_0}$; in general the MSB position of $E_i$ is

$$m_i = 2^i m_0 \tag{9.76}$$

with $m_0 < 0$, so $m_i$ marches right and the format $\mathrm{ufix}(m_i, \ell-1)$ loses a doubling number of bits every step. This survives rounding provided the squarer is a faithful [[Squarers and Integer Powers|truncated squarer]] rather than an exact one (p. 296) — the sharpest contrast with Newton-Raphson, where the squarer must be *exact* and the datapath *doubles* every step.

**Balance the squarer's two error sources and its input width falls out.** Split the error on $E$ into its sources (9.83--9.85): $\delta'_{i+1} = \delta^{\text{square}}_i + \delta^{\text{truncE}}_i + (E_i+e_i)\delta'_i$, with $\delta'_0 = 0$. A faithful truncated squarer contributes $\delta^{\text{square}}_i < 2^{\ell-1}$. The optional truncation feeding it contributes $\delta^{\text{truncE}}_i = \widetilde E_i^{\,2} - E_i^2 = (\widetilde E_i + E_i)(\widetilde E_i - E_i)$ — the difference-of-squares identity — where $|\widetilde E_i - E_i| < 2^{\ell'_i}$ by the definition of a truncation and $(\widetilde E_i + E_i) < 2^{m_i+1}$, so the product is bounded by $2^{m_i+1+\ell'_i}$. Setting that equal to $2^{\ell-1}$ balances the two contributions:

$$\ell'_i = \ell - m_i - 2 \tag{9.86}$$

The squarer's input is then $m_i - \ell'_i + 1 = 2m_i - \ell + 3$ bits against an output of $2m_i - \ell + 2$ bits: input exactly one bit wider than output, the natural shape for a squarer (p. 298).

> [!note] The two datapaths have opposite error behaviour, and the sizing follows from that
> In (9.85) the incoming error is scaled by $(E_i + e_i) < 2^{m_i+1} \ll 1$, so **the $E$ datapath forgets**: $\overline{\delta}'_{n-1} \approx 2^{\ell}$, i.e. after all its truncations and roundings it is about as accurate as its last step alone. The corresponding recurrence for $Q$ (9.91) carries the factor $(1+e_i) \approx 1$, so **the $Q$ datapath accumulates**. That asymmetry is why $E$ is truncated per step with a moving $\ell'_i$, while a single common LSB $\ell$ serves $Q_i$ at every step — nothing is gained by making an early $Q$ step more accurate than the last one.

**Size the $Q$ multiplier the same way, from the accumulating recurrence.** Writing $Q_{i+1} = Q_i + P_i$ and inserting the exact intermediates term by term (9.88--9.91) gives $\delta_{i+1} = \delta^{\text{mult}}_i + \delta^{\text{truncQ}}_i + Q_i\delta'_i + (1+e_i)\delta_i$. A faithful multiplier bounds $\delta^{\text{mult}}_i$ by $2^{\ell}$; $Q_i < 2$ bounds $Q_i\delta'_i$ by a little over $2^{\ell+1}$; and balancing $\delta^{\text{truncQ}}_i = (\widetilde Q_i - Q_i)E_i$ against $2^{\ell}$, using $E_i < 2^{m_i}$, gives

$$\ell''_i = \ell - m_i \tag{9.92}$$

— again a multiplier whose input and output widths are comparable. The recurrence closes as $\overline{\delta}_{i+1} = 2^{\ell+1} + 2\overline{\delta}'_i + (1+2^{m_i})\overline{\delta}_i$ (9.93). Combined with the series-truncation error $\delta_{\text{approx}} = XR_0\sum_{j\ge 2^n} e_0^{\,j}$ (9.79--9.82), bounded from $e_0$ and $|XR_0| < 2$, this determines the smallest $\ell$ that still yields a faithfully rounded divider. There is no closed form; the book's advice is to write a program that evaluates the recurrences (p. 299). The general method is [[Error Analysis]].

**Worked sizing (p. 298).** Take $\ell = -32$ and $m_0 = -7$, hence $m_1 = -14$ and $m_2 = -28$. First step: $\ell'_0 = -32 + 7 - 2 = -27$, so the squarer takes $\mathrm{ufix}(-7,-27)$ — 21 bits — to $\mathrm{ufix}(-14,-33)$, 20 bits. Second step: $\ell'_1 = -32 + 14 - 2 = -20$, an $\mathrm{ufix}(-14,-20)$ input of **7 bits** producing a 6-bit $\mathrm{ufix}(-28,-33)$ output. Two steps and the squarer has collapsed from 21 bits to 7. The accumulated bound is $\overline{\delta}'_2 = 2^{-32} + 2^{-45}$.

**Choosing $\ell$ and the initial formats.** The LSB of $R_0$ is $\ell_0$ and the LSB of $D$ is $-w_F$, so the exact product $R_0D$ — and hence the exact $E_0 = 1 - R_0D$ — has LSB $\ell_0 - w_F$; the conservative choice is $\ell = \ell_0 - w_F$, and the error analysis above says how much larger it may be, which is where the hardware saving lives. Initialisation exploits the same known zeros: the bits of $E_0$ above $m_0$ are zero by construction, so the $R_0D$ multiplier need not compute any bit above $m_0$ and the subtracter operates on $\mathrm{ufix}(m_0,\ell)$ numbers (p. 296). Fixed-point formats and the $\mathrm{ufix}$ notation are in [[Number Formats]]; the faithful-rounding target $|\delta_Q| < 2^{-w_F-2}$ is in [[Error Accuracy]].

$$\boxed{\ Q_{i+1} = Q_i + \widetilde Q_i E_i,\qquad E_{i+1} = \widetilde E_i^{\,2},\qquad m_i = 2^i m_0,\ \ \ell'_i = \ell - m_i - 2,\ \ \ell''_i = \ell - m_i\ }$$

Starting from a seed accurate to $|m_0|$ bits, $n$ iterations give $2^n|m_0|$ correct bits, so a $w_F$-bit faithful quotient needs $n = \lceil \log_2(w_F/|m_0|) \rceil$ steps — each one squarer *in parallel with* one truncated multiplier, plus one exact addition.

**When it breaks.**

- **$D$ near zero.** Like every reciprocal method this works only on a normalised significand $D \in [1,2)$; there is no useful bound on $e_0$ otherwise. See [[Division by Reciprocal]].
- **No exact remainder.** The result is faithful, never correctly rounded, and $R = X - QD$ is never formed. Anything needing an exact remainder or IEEE correct rounding wants [[SRT Division]].
- **The $Q$ path cannot be truncated aggressively.** Errors accumulate there, so unlike [[Newton-Raphson Reciprocal]] this method is not self-correcting on the quotient side and demands the full error analysis before a single guard bit is dropped. A shorter critical path bought with a longer design phase.
- **Two iterations in, the shrinkage stops mattering.** By the worked example the second squarer is already 7 bits — below the granularity of anything but LUT logic. At small precisions [[Halley Reciprocal Iteration]] (cubic: one squarer and two multipliers) or a direct degree-2 polynomial reciprocal usually wins on total latency.
- **You need the multipliers.** With no spare multiplier the whole family is off the table; a digit recurrence is a subtracter and a mux.
- **A short critical path is worthless if you cannot fill it.** The win is per-step latency; on a throughput machine that pipelines deeply, [[Goldschmidt Division]]'s two fully independent multiplications schedule just as well.

**RTL (Spade).** One iteration, at a concrete format: $\ell = -16$, so $Q_i$ is $\mathrm{ufix}(0,-16)$ in 17 bits and $E_i$ is $\mathrm{ufix}(m_i,-17)$ in 17 bits, with $m_i = -4$.

```spade
// One iteration of the quadratic series recurrence, l = -16.
//   q : ufix(0,  -16)  -> uint<17>, integer value Q * 2^16
//   e : ufix(m_i,-17)  -> uint<17>, integer value E * 2^17
entity qseries_step(q: uint<17>, e: uint<17>) -> (uint<17>, uint<17>) {
    let qt: uint<17> = q & 0b1_1111_1111_1111_0000;
    let et: uint<17> = e & 0b1_1111_1111_1111_1000;
    let p:  uint<17> = (qt * e).as_bits()[17..34].as_uint();
    let e2: uint<17> = (et * et).as_bits()[17..34].as_uint();
    (q +. p, e2)
}
```

`qt` and `et` are the two `T` boxes of the diagram: masking off low bits *is* truncation, here to $\ell''_i = \ell - m_i = -12$ (4 bits dropped) and to $\ell'_i = \ell - m_i - 2 = -14$ (3 bits dropped). `p` is $P_i$ — `*` widens to `uint<34>` and the slice `[17..34]` keeps the high 17, which is the fixed-point realignment by $2^{\ell-1}$ rather than a separate shifter. `q +. p` is the exact final addition, wrapping instead of widening because $Q_{i+1} < 2$ holds for real operands. Everything is combinational; a real operator registers between steps, or on FPGA uses the DSP block's own output register.

The uniform 17-bit containers are a simulation convenience. Synthesis of the real operator gives *each* step its own widths — at this $m_i$ the squarer is 11 bits in and 10 bits out, and the multiplier takes a 13-bit $\widetilde Q_i$ — which is exactly the shrinkage the fixed container hides.

**Loop control.** Because every step has different widths, the natural implementation is *unrolled in space*, one sized instance per iteration, and the loop control is a wire that costs nothing. Folding into a single reused datapath costs a counter, an input multiplexer on both recurrences, and — the real price — forces every step to be built at step 0's widths, throwing away the shrinkage that motivates the method. Folding is only sensible when the multiplier is a fixed-width hard block, since then step 2 costs the same as step 0 anyway.

**Related Notes**

- [[Newton-Raphson Reciprocal]] – compares: identical convergence order and iteration count, but its step is a squarer *then* a multiplier, its datapath grows instead of shrinking, and it is self-correcting where this is not.
- [[Goldschmidt Division]] – extends: rewriting Goldschmidt's $p_j \times d_j$ as $d_j + d_je_j$ to skip the known zeros recovers this recurrence exactly (p. 300).
- [[Division by Reciprocal]] – depends-on: supplies the $\delta_{\text{mult}}/\delta_{\text{recip}}$ error split and the normalised-$D$ precondition this method inherits.
- [[Reciprocal Seed Table]] – depends-on: produces $R_0$ and hence $m_0$, which sets both the iteration count and every truncation position.
- [[Squarers and Integer Powers]] – depends-on: the $E$ path needs a *faithful truncated* squarer; (9.76) survives rounding only because that squarer is faithful.
- [[Truncated Multipliers]] – depends-on: the $Q$ path multiplier must be faithful to $2^{\ell}$ for the bound (9.93) to hold.
- [[Error Analysis]] – supports: the successive-rewriting method that turns (9.85) and (9.91) into a value for $\ell$.
- [[DSP Blocks]] – counter-example: the $Q_i + Q_iE_i$ rewrite is a pure win in LUTs and a wash on a fixed-width hard multiplier, where $Q_i(1+E_i)$ is preferable.
- [[Halley Reciprocal Iteration]] – compares: cubic convergence for one squarer and two multipliers, filling the gap between one step and two of this one.
- [[VFloat Ad Hoc Series Divider]] – compares: another truncated series, but one that costs more than a one-step version of this and suits only small precisions.
- [[Choosing a Divider]] – compares: where this sits against the digit-recurrence and other multiplicative families.

## References

- de Dinechin & Kumm, *Application-Specific Arithmetic*, §9.4 "Division Using Quadratic Series Expansion", pp. 295–299 — (9.64)–(9.66), (9.71)–(9.76), Fig. 9.17 p. 296, the $\ell'_i$/$\ell''_i$ balancing (9.86) and (9.92), the error recurrences (9.85), (9.87), (9.91), (9.93), and the worked $\ell = -32$ sizing p. 298.
- §9.5.1, p. 300 — the equivalence with Goldschmidt after the known-zeros rewrite.
- §9.3.2 "Newton-Raphson", pp. 291–294 — the seed $R_0$, $e_0 = 1 - R_0D$, and the sequential-step comparison.
