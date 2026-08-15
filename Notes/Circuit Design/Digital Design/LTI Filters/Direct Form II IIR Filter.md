---
title: Direct Form II IIR Filter
description: "Commute the recursive and non-recursive halves so both delay lines hold the same values and can be shared, halving registers — but the b_i now multiply the loop signal t'(k) and must be built at extended precision."
kind: circuit
source: "ASA §23.1.5.2–23.1.6, pp. 679-681"
status: seed
spade: simulated
tags: [digital, lti-filters, iir, feedback, fixed-point]
aliases:
  - Direct Form II
  - DF-II
  - DFII
  - Direct Form II IIR
  - Direct-Form II Filter
---

# Direct Form II IIR Filter

An IIR structure that runs the recursive half *before* the non-recursive half so that a single delay line serves both, at the price of putting every $b_i$ multiplier on the wide loop signal instead of the narrow input.

```tikz title="Order-2 direct form II: one shared delay column between two SOPCs, with fixed-point formats on every wire"
\usepackage{circuitikz}
\begin{document}
\begin{circuitikz}[>=stealth, font=\small]
  % left adders (recursive half)
  \draw (0,2.4) circle (0.22); \node at (0,2.4) {$+$};
  \draw (0,1.2) circle (0.22); \node at (0,1.2) {$+$};
  \draw[->] (-1.8,2.4) -- (-0.22,2.4);
  \node[anchor=south, font=\tiny] at (-1.3,2.48) {$u(k)$};
  \node[anchor=north, font=\tiny] at (-1.3,2.32) {sfix$(0,\ell)$};
  \draw[->] (0,1.42) -- (0,2.18);

  % feedback multipliers (pointing left)
  \draw (2.2,1.55) -- (2.2,0.85) -- (1.3,1.2) -- cycle; \node[font=\tiny] at (1.88,1.2) {$-a_1$};
  \draw (2.2,0.55) -- (2.2,-0.15) -- (1.3,0.2) -- cycle; \node[font=\tiny] at (1.88,0.2) {$-a_2$};
  \draw[->] (1.3,1.2) -- (0.22,1.2);
  \draw[->] (1.3,0.2) -- (-0.6,0.2) -- (-0.6,1.2) -- (-0.22,1.2);

  % shared delay chain
  \draw[->] (0.22,2.4) -- (3.4,2.4);
  \fill (2.6,2.4) circle (0.05);
  \node[anchor=south, font=\tiny] at (1.5,2.48) {$t'(k)$};
  \node[anchor=north, font=\tiny] at (1.5,2.32) {sfix$(m',\ell_{\text{ext}})$};
  \draw (2.6,2.4) -- (2.6,1.9);
  \draw[fill=black!8] (2.45,1.55) rectangle (2.75,1.9);
  \draw (2.6,1.55) -- (2.6,1.2);
  \fill (2.6,1.2) circle (0.05);
  \draw (2.6,1.2) -- (2.6,0.9);
  \draw[fill=black!8] (2.45,0.55) rectangle (2.75,0.9);
  \draw (2.6,0.55) -- (2.6,0.2);
  \fill (2.6,0.2) circle (0.05);
  \draw (2.6,1.2) -- (2.2,1.2);
  \draw (2.6,0.2) -- (2.2,0.2);
  \node[anchor=west, font=\tiny] at (2.80,1.72) {$t'(k{-}1)$};
  \node[anchor=west, font=\tiny] at (2.80,0.72) {$t'(k{-}2)$};

  % forward multipliers (pointing right)
  \draw (3.4,2.65) -- (3.4,2.15) -- (4.0,2.4) -- cycle; \node[font=\tiny] at (3.6,2.4) {$b_0$};
  \draw (3.4,1.45) -- (3.4,0.95) -- (4.0,1.2) -- cycle; \node[font=\tiny] at (3.6,1.2) {$b_1$};
  \draw (3.4,0.45) -- (3.4,-0.05) -- (4.0,0.2) -- cycle; \node[font=\tiny] at (3.6,0.2) {$b_2$};
  \draw[->] (2.6,1.2) -- (3.4,1.2);
  \draw[->] (2.6,0.2) -- (3.4,0.2);

  % right adders (non-recursive half)
  \draw (5.2,2.4) circle (0.22); \node at (5.2,2.4) {$+$};
  \draw (5.2,1.2) circle (0.22); \node at (5.2,1.2) {$+$};
  \draw[->] (4.0,2.4) -- (4.98,2.4);
  \draw[->] (4.0,1.2) -- (4.98,1.2);
  \draw[->] (4.0,0.2) -- (5.2,0.2) -- (5.2,0.98);
  \draw[->] (5.2,1.42) -- (5.2,2.18);

  % output rounding
  \draw (6.1,2.10) rectangle (7.5,2.70);
  \node[font=\tiny] at (6.8,2.4) {final round};
  \draw[->] (5.42,2.4) -- (6.1,2.4);
  \draw[->] (7.5,2.4) -- (8.8,2.4);
  \node[anchor=south, font=\tiny] at (8.15,2.48) {$\widetilde{y}_{\text{out}}(k)$};
  \node[anchor=north, font=\tiny] at (8.15,2.32) {sfix$(m',\ell')$};
\end{circuitikz}
\end{document}
```

*after Fig. 23.11a, p. 680, with the formats of Fig. 23.17, p. 690.*

**Read direct form I as a cascade, then swap the two stages.** The recursive difference equation

$$y(k)=\sum_{i=0}^{n}b_i\,u(k-i)-\sum_{i=1}^{m}a_i\,y(k-i) \tag{23.15}$$

has transfer function $H(z)=B(z)/A(z)$ with $B(z)=\sum_{i=0}^n b_iz^{-i}$ and $A(z)=1+\sum_{i=1}^m a_iz^{-i}$. Direct form I evaluates this left to right: an FIR stage $B(z)$ producing $t(k)$, then the all-pole stage $1/A(z)$. Since $H=B\cdot A^{-1}=A^{-1}\cdot B$ — **commutativity of convolution**, the same identity that lets any cascade be reordered (p. 674) — the all-pole stage may run first. That reordering *is* direct form II (Fig. 23.10, p. 680).

**Write the two halves out and the shared node names itself.** Running $1/A(z)$ first defines an intermediate signal $t'$ by $A(z)T'(z)=U(z)$, i.e.

$$t'(k)=u(k)-\sum_{i=1}^{m}a_i\,t'(k-i)$$

and then $Y(z)=B(z)T'(z)$ gives

$$y(k)=\sum_{i=0}^{n}b_i\,t'(k-i)$$

Composing them recovers $Y=B\cdot A^{-1}U=HU$, so the two structures compute the same LTI filter — *exactly*, in $\mathbb{R}$. In finite precision they do not, which is the whole content of the rest of this note.

**Both delay lines index the same sequence, so build one.** The recursive half needs $t'(k-1)\ldots t'(k-m)$; the non-recursive half needs $t'(k-1)\ldots t'(k-n)$. These are the *same* delayed values of the *same* signal, not two coincidentally-equal sequences. A parallel implementation therefore keeps a single register column of depth $\max(n,m)$ instead of the $n+m$ registers of direct form I — half of them, when $m=n$ (p. 679). Fig. 23.10 draws the two columns separately to make the commutation visible; Fig. 23.11a is the same circuit after merging them.

**The registers you kept are the wide ones.** $t'$ is computed by the feedback loop, so it carries the infinite accumulation of rounding errors and must live in the extended internal format `sfix(m', ℓ_ext)` — $m'-\ell_{\text{ext}}+1$ bits — where

$$\ell_{\text{ext}}=\ell'-1-\left\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\right\rceil,\qquad \mathcal{H}_\delta(z)=\frac{1}{A(z)}$$

is the guard-bit rule of [[Error Analysis]] (Eq. 23.37, p. 694). The input $u(k)$ is only `sfix(0, ℓ)`, $1-\ell$ bits. Direct form I stores $n$ copies of the narrow signal and $m$ copies of the wide one; direct form II stores $\max(n,m)$ copies of the wide one. **At $n=m$ the register saving is therefore exactly $n\,(1-\ell)$ bits — the input delay line, and nothing more.** It is not half the register *bits*; it is half the register *count*, and the half that vanished was the cheap half.

**And the $b_i$ multipliers grew by the same amount.** In direct form I the $b_i$ multiply $u(k-i)$, so each is a constant multiplier with a $(1-\ell)$-bit input. Here they multiply $t'(k-i)$, so each has an $(m'-\ell_{\text{ext}}+1)$-bit input. Constant-multiplier cost grows roughly linearly in the input width ([[Multiplication by Constants]]), so the $n+1$ forward multipliers inflate by the same factor $(m'-\ell_{\text{ext}}+1)/(1-\ell)$ that the register ledger only saved $n$ copies of (p. 681). The $a_i$ multipliers are wide in both forms, so they do not enter the comparison.

**Put the book's own numbers on it.** The lowest resonator of the bell model (p. 694) has $\ell=\ell'=-8$, $\langle\!\langle\mathcal{H}\rangle\!\rangle=178\,750$ and $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle=1.2806\times10^6$. Then $m'=\lceil\log_2(178750+2^{-8})\rceil=18$ by (23.24), and $\ell_{\text{ext}}=-8-1-21=-30$, so $t'$ is $18+30+1=49$ bits wide while $u$ is $9$. For this order-2 filter direct form I holds $2\times9+2\times49=116$ register bits and direct form II holds $2\times49=98$ — a 15 % saving — while three $b_i$ multipliers go from 9-bit to 49-bit operands. That ratio, not the register count, is what decides the structure.

> [!important] The register saving is real; the reason usually given for it is not
> "Half the registers" is true as a count and misleading as a cost. Direct form II can still win — the book's phrasing is that a *stable implementation* using it "may well turn out to be cheaper, thanks to its smaller multipliers" than a direct form I forced to be equally stable (p. 681) — but the comparison must be made at **equal guaranteed accuracy**, with $\ell_{\text{ext}}$ computed from $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ for both. Compared at equal nominal word length it is not a comparison at all.

**Two independent SOPCs, one rounding each.** Direct form I is a single [[SOPC, Sum of Products by Constants]] over all $n+m+1$ taps, so one bit heap absorbs every partial product and one rounding sits at its bottom. Direct form II splits into two: the recursive SOPC that produces $t'(k)$ and the non-recursive SOPC that produces $\widetilde{y}(k)$ (p. 679). That is two accumulations and two roundings instead of one, and only the second is the "final round" of the diagram — the first is *inside the loop* and its error is what $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ amplifies. The split is also why the coefficients cannot be merged into one [[Multiplication by Constants]] problem: the $a_i$ and $b_i$ subexpression-share only within their own SOPC.

**Critical path: one multiplier plus one adder chain, same as direct form I.** The loop is $t'(k-i)\to$ multiplier $\to$ adder chain $\to t'(k)$, and it is combinational — nothing may be registered between the delay-line tap and the adder that feeds it, or the recurrence changes. The forward path $t'\to b_i\to$ adder chain is combinational too but not in the loop, so it can be pipelined freely. This is the one advantage direct form II keeps over its transpose, whose loop runs through **two** multipliers and two adders (p. 681). If even one multiplier plus the chain misses timing, the escape is to register the $t'(k)$ wire of Fig. 23.10 — but that reintroduces a second, differently-delayed copy of the signal and the register sharing is gone (p. 681).

**On FPGAs the trade is a step function, not a ratio.** A DSP block has a fixed maximum operand width, so widening the $b_i$ operand does not scale cost smoothly — below the threshold it is free and above it one block becomes a multi-block construction — while the registers direct form II saved were sitting in slice flip-flops that pair with LUTs already spent. On an ASIC both sides scale continuously and the linear ledger above is the right one.

> [!warning] Not covered in the source — needs outside research
> Ch. 23 gives no FPGA mapping for any filter structure; it defers all constant multiplication to Ch. 12 (p. 697). The DSP-block threshold argument above is the general FPGA reasoning of [[FPGAs]] and [[Multiplication by Constants]], not a claim from this chapter, and the specific operand widths and block counts are device-dependent.

$$\boxed{\ t'(k)=u(k)-\sum_{i=1}^{m}a_i\,t'(k-i),\qquad y(k)=\sum_{i=0}^{n}b_i\,t'(k-i)\ }$$

with a single register column of depth $\max(n,m)$, every stage in `sfix(m', ℓ_ext)`.

## When it breaks

- **When $n \ne m$.** The saving is $\min(n,m)$ registers, not $\max(n,m)$; at $n=0$ (all-pole) or $m=0$ (FIR) there is nothing to share and direct form II collapses back to a plain [[Direct-Form FIR Filter]] or an all-pole loop.
- **When $\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle$ is large.** Every guard bit demanded by (23.37) widens the delay line *and* all $n+1$ forward multipliers, so the cost of poles near the unit circle enters twice. Direct form I pays it once.
- **When the loop misses timing.** One multiplier plus an $m$-input adder chain is not free; the fix costs the register sharing outright, which removes the only reason to have chosen this structure.
- **When you can afford two multipliers of latency.** [[Transposed Direct Form II IIR Filter]] shares registers *and* multiplies the $b_i$ by the narrow $u(k)$ — apparently the best combination (p. 681) — so direct form II is the fallback when its critical path fails, not the default.
- **At high order.** Direct forms of any kind become ill-conditioned as $n$ grows because the coefficients of a high-degree $A(z)$ are hypersensitive to perturbation; a [[Biquad Cascade]] of order-2 sections keeps each section's poles independent and is the standard escape.
- **Overflow inside the loop is not the failure it looks like.** The internal adds wrap modulo $2^{m'}$, and provided the true value fits in `sfix(m', ℓ_ext)` the final result is still correct (p. 691) — intermediate overflow in a two's-complement sum cancels. That is an assumption about the *sum*, not about each partial sum, and it fails the moment $m'$ was chosen from an application-specific peak instead of (23.24).

## RTL (Spade)

```spade
/// Order-2 direct form II. Loop format int<18> at LSB 2^-13 (6 guard bits);
/// input sfix(0,-7) = int<8>; coefficients at LSB 2^-10; output sfix(4,-7) = int<12>.
entity df2_biquad(
    clk: clock,
    rst: bool,
    u: int<8>,
    a1: int<18>, a2: int<18>,
    b0: int<18>, b1: int<18>, b2: int<18>,
) -> int<12> {
    decl t;
    reg(clk) t1: int<18> reset(rst: 0) = t;
    reg(clk) t2: int<18> reset(rst: 0) = t1;

    // input aligned to the internal LSB: 6 guard bits
    let ue: int<18> = sext(u) << 6;

    // recursive SOPC: t'(k) = u(k) - a1 t'(k-1) - a2 t'(k-2)
    let fb: int<37> = a1 * t1 + a2 * t2;
    let t: int<18> = ue -. trunc(fb >>> 10);

    // non-recursive SOPC, over the *same* delay line
    let p0: int<38> = sext(b0 * t);
    let p1: int<38> = sext(b1 * t1);
    let p2: int<38> = sext(b2 * t2);
    let ff: int<38> = p0 +. p1 +. p2;

    trunc(ff >>> 16)
}
```

`t1` and `t2` are the two grey boxes of the diagram — the *single* shared column, read by both SOPCs. `decl t` is what makes the sharing expressible: `t` is used by the registers before it is defined, which is a delayed read, not combinational feedback. The width arithmetic is the whole trade in miniature: `int<18>` for the loop against `int<8>` for the input, so `b0*t` is an 18×18 product where direct form I would have built an 18×8 one. `fb >>> 10` realigns the coefficient scale and `trunc` truncates toward $-\infty$ — that truncation is $\delta_{\text{r}}$, and it is inside the loop. Synthesis will not build six multipliers: with the coefficients tied to constants the products collapse into shift-and-add trees and the two SOPCs become two independent MCM problems.

> [!warning] Spade's `>>` is a *logical* shift even on `int<N>`
> `fb >> 10` on an `int<37>` emits `\fb >> 10` on an unsigned `logic[36:0]` — negative values shift in zeros and the filter is silently wrong for half its inputs. The arithmetic shift is `>>>`, which emits `$signed(\fb ) >>> ...`. This compiles either way; only simulation catches it.

Verified with `.zettel/sim.sh`: **3017 vectors pass**, comprising a pure two-sample-delay configuration ($a=0$, $b=(0,0,1)$, so $y(k)=u(k-2)$ exactly), an asymmetric impulse response $b=(1,2,4)$ checked against the hard-coded sequence $1,2,4,0$, an order-2 resonator with poles at radius $\sqrt{1/2}$, and 3000 random $(u, a_1, a_2, b_0, b_1, b_2)$ vectors compared bit-exactly against a behavioural recurrence. Swapping `t1` and `t2` in the forward SOPC fails 2899 of them.

## Related Notes

- [[Direct Form I IIR Filter]] – compares: the structure this one is a stage-commutation of; keeps $n+m$ registers but multiplies the $b_i$ by the narrow $u(k)$.
- [[Transposed Direct Form II IIR Filter]] – extends: transposes this graph to get shared registers *and* narrow $b_i$ multipliers, at two multipliers of critical path.
- [[SOPC, Sum of Products by Constants]] – depends-on: each half of the structure is exactly one, and the split into two is what costs a rounding.
- [[Tapped Delay Line]] – depends-on: the shared register column, here $\max(n,m)$ deep at the extended internal width.
- [[Error Analysis]] – supports: supplies $\ell_{\text{ext}}=\ell'-1-\lceil\log_2\langle\!\langle\mathcal{H}_\delta\rangle\!\rangle\rceil$, the number that sets every width in the diagram.
- [[Truncated Multipliers]] – supports: the wide $b_i\times t'(k-i)$ products are discarded below $\ell_{\text{ext}}$ anyway, so the forward SOPC is the textbook place to spend a truncated multiplier.
- [[Biquad Cascade]] – counter-example: at high order the direct forms lose to a chain of order-2 sections regardless of how the registers are counted.
- [[Choosing a Filter Structure]] – compares: where this sits against every sibling at equal guaranteed accuracy.

## References

de Dinechin & Kumm, *Application-Specific Arithmetic* (Springer, 2024), Ch. 23:

- §23.1.4, p. 674 — commutativity of convolution, the identity that licenses the stage swap.
- §23.1.5.2, pp. 678–680 — recursive difference equation (23.15), direct form I (Fig. 23.9a), direct form II (Fig. 23.10) and its shared-delay rearrangement (Fig. 23.11a), the two-independent-SOPC decomposition.
- §23.1.6, p. 681 — why the $b_i$ multipliers are larger in direct form II, why a stable direct form II may still be cheaper, and the register-vs-critical-path escape.
- §23.3.2–23.3.5, pp. 690–694 — the internal format `sfix(m', ℓ_ext)` of Fig. 23.17, the output MSB bound (23.24), modulo-$2^{m'}$ overflow, the guard-bit formula (23.37), and the bell-resonator worked numbers.
